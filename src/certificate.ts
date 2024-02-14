// import { MerkleTree } from 'merkletreejs';
import * as Errors from './errors';
import { WebCrypto } from './cryptography/webCrypto';
import { hexEncode, hexDecode } from './binConversions';
import {
    sha256,
    numRange,
    objectToBytes,
    bytesToObject,
} from './utils';
import { TKeyGenAlgorithmValidHashValues } from './cryptography/baseTypes';
import {
    DEF_SIGN_HASH_ALGORITHM as defaultSignHash,
    EmptyKeyParams,
    EKeyParamsIds,
    mKeyPairParams,
} from './cryptography/cryptoDefaults';
import { BaseECKey } from './cryptography/baseECKey';
import {
    Signable,
    ISignableUnnamedObject,
    ISignableUnnamedObjectNoTag,
    ISignableObject,
} from './signable';

const TYPE_TAG_VALUE = 'cert';

const DEF_SALT_BYTE_LEN: number = 32;

function calculateSymmetryDepth(totalLeaves: number): number {
    return Math.ceil(Math.log2(totalLeaves));
}

function missingSymmetryLeaves(givenLeaves: number): number {
    return (2 ** calculateSymmetryDepth(givenLeaves)) - givenLeaves;
}

function makeNextLayerNode(a: Uint8Array, b: Uint8Array): Uint8Array {
    const ab = new Uint8Array(a.length + b.length);
    ab.set(a, 0);
    ab.set(b, a.length);
    return sha256(ab);
}

interface IMerkleData {
    depth: number;
    root: Uint8Array;
    multiProof: Uint8Array[];
}

function createMerkleTree(
    leaves: Uint8Array[],
    clearIndexesList: number[] = [],
): IMerkleData {
    if (leaves.length === 0) {
        throw new Error(Errors.EMPTY_VALUE);
    }
    let sortedIndexes: number[];
    if (clearIndexesList.length === 0) {
        sortedIndexes = numRange(0, leaves.length - 1);
    } else {
        sortedIndexes = clearIndexesList.sort((a, b) => { return a - b; });
    }
    if (sortedIndexes[0] < 0 || sortedIndexes[sortedIndexes.length - 1] >= leaves.length) {
        throw new Error(Errors.MERK_WRONG_IDXS);
    }

    const treeDepth = Math.ceil(Math.log2(leaves.length));
    const expectedLeavesCount = 2 ** treeDepth;
    if (leaves.length < expectedLeavesCount) {
        throw new Error(`Merkle tree must be balanced. ${expectedLeavesCount - leaves.length} more leave(s) missing.`);
    }

    const result: IMerkleData = {
        depth: treeDepth,
        root: new Uint8Array(0),
        multiProof: [],
    };
    // ========================= TREE LAYERS CREATION ==========================
    const layersCount = (treeDepth + 1);
    const layers: Uint8Array[][] = new Array<Array<Uint8Array>>(layersCount);
    layers[0] = leaves;

    for (let layerIdx = 1; layerIdx < layersCount; layerIdx += 1) {
        const layer = new Array<Uint8Array>(2 ** (layersCount - (layerIdx + 1)));
        for (let nodeIdx = 0; nodeIdx < layer.length; nodeIdx += 1) {
            const leftIdx = 2 * nodeIdx;
            const left = layers[layerIdx - 1][leftIdx];
            const rightIdx = leftIdx + 1;
            const right = layers[layerIdx - 1][rightIdx];
            layer[nodeIdx] = makeNextLayerNode(left, right);
        }
        layers[layerIdx] = layer;
    }

    result.root = layers[layers.length - 1][0];

    // ========================== MULTIPROOF CREATION ==========================
    const isClearLeaf = (idx: number) => {
        return (clearIndexesList.indexOf(idx) > -1);
    };

    let needMultiproof = false;
    let knownNodes: boolean[] = layers.length
        ? layers[0].map((_, i) => {
            const isClear = isClearLeaf(i);
            if (!needMultiproof && !isClear) {
                needMultiproof = true;
            }
            return isClear;
        })
        : [];
    if (!needMultiproof) {
        return result;
    }
    const multiProof: Uint8Array[] = [];
    for (let layerIdx = 0; layerIdx < (layers.length - 1); layerIdx += 1) {
        const nextKnownNodes: boolean[] = new Array<boolean>(layers[layerIdx + 1].length)
            .fill(false);
        for (let layerNodeIdx = 0; layerNodeIdx < layers[layerIdx].length; layerNodeIdx += 1) {
            const pairedLayerNodeIdx = layerNodeIdx % 2 ? layerNodeIdx - 1 : layerNodeIdx + 1;
            if (!knownNodes[layerNodeIdx] && knownNodes[pairedLayerNodeIdx]) {
                multiProof.push(layers[layerIdx][layerNodeIdx]);
                nextKnownNodes[Math.floor(layerNodeIdx / 2)] = true;
            } else if (knownNodes[layerNodeIdx] && knownNodes[pairedLayerNodeIdx]) {
                nextKnownNodes[Math.floor(layerNodeIdx / 2)] = true;
            }
        }
        knownNodes = nextKnownNodes;
    }
    result.multiProof = multiProof;

    return result;
}

function createLeaf(valueKey: string, value: string, salt: Uint8Array): Uint8Array {
    const leafStr = `${value}${valueKey}${hexEncode(salt)}`;
    const hash = sha256(new TextEncoder().encode(leafStr));
    return hash;
}

function verifyMerkleTree(
    clearLeaves: Uint8Array[],
    clearIndexes: number[],
    totalLeaves: number,
    root: Uint8Array,
    multiproof: Uint8Array[],
): boolean {
    const depth = calculateSymmetryDepth(totalLeaves);
    const treeLayers: Uint8Array[][] = [];
    const layersCount = depth + 1;

    const isClearLeaf = (idx: number) => {
        return clearIndexes.indexOf(idx) >= 0;
    };
    const _multiproof = multiproof;
    let currLayer: Uint8Array[] = new Array<Uint8Array>(2 ** depth)
        .fill(new Uint8Array(0))
        .map((_, i) => {
            if (isClearLeaf(i)) {
                return clearLeaves[clearIndexes.indexOf(i)];
            }
            return _;
        });
    for (let layerIdx = 0; layerIdx < layersCount; layerIdx += 1) {
        const layerNodesCount = 2 ** (layersCount - layerIdx - 1);
        const nextLayer: Uint8Array[] = new Array<Uint8Array>(Math.floor(layerNodesCount / 2))
            .fill(new Uint8Array(0));
        if (layerNodesCount > 1) {
            for (let layerNodeIdx = 0; layerNodeIdx < layerNodesCount; layerNodeIdx += 1) {
                const pairedLayerNodeIdx = layerNodeIdx % 2 ? layerNodeIdx - 1 : layerNodeIdx + 1;
                if (!currLayer[layerNodeIdx].length && currLayer[pairedLayerNodeIdx].length) {
                    if (_multiproof.length <= 0) {
                        return false;
                    }
                    currLayer[layerNodeIdx] = _multiproof.shift()!;
                    const leftIdx = layerNodeIdx < pairedLayerNodeIdx
                        ? layerNodeIdx : pairedLayerNodeIdx;
                    const rightIdx = layerNodeIdx < pairedLayerNodeIdx
                        ? pairedLayerNodeIdx : layerNodeIdx;
                    nextLayer[Math.floor(layerNodeIdx / 2)] = makeNextLayerNode(
                        currLayer[leftIdx],
                        currLayer[rightIdx],
                    );
                } else if (currLayer[layerNodeIdx].length && currLayer[pairedLayerNodeIdx].length) {
                    const leftIdx = layerNodeIdx < pairedLayerNodeIdx
                        ? layerNodeIdx : pairedLayerNodeIdx;
                    const rightIdx = layerNodeIdx < pairedLayerNodeIdx
                        ? pairedLayerNodeIdx : layerNodeIdx;
                    nextLayer[Math.floor(layerNodeIdx / 2)] = makeNextLayerNode(
                        currLayer[leftIdx],
                        currLayer[rightIdx],
                    );
                }
            }
        }
        treeLayers.push(currLayer);
        if (!nextLayer.length) break;
        currLayer = nextLayer;
    }
    return hexEncode(treeLayers[treeLayers.length - 1][0]) === hexEncode(root);
}

interface ICertMainDataInternal {
    target: string;
    fields: string[];
    salt: Uint8Array;
    root: Uint8Array;
    certifier: BaseECKey;
}

interface IUnnamedCertifier extends Array<any> {
    /** Key type (e.g. 'ecdsa') */
    [0]: string;
    /** Curve */
    [1]: string;
    /** Public key raw value */
    [2]: Uint8Array;
}

interface IUnnamedCertMainData extends Array<any> {
    /** Target */
    [0]: string;
    /** Fields */
    [1]: string[];
    /** Salt */
    [2]: Uint8Array;
    /** Root */
    [3]: Uint8Array;
    /** Certifier */
    [4]: IUnnamedCertifier;
}

/**
 * Unnamed certificate object meant for transfer.
 */
export interface IUnnamedCert extends ISignableUnnamedObject {
    /** Data */
    [1]: IUnnamedCertMainData;
    /** Signature */
    [2]: Uint8Array;
    /** MultiProof */
    [3]?: Uint8Array[];
}

export interface IUnnamedCertNoTag extends ISignableUnnamedObjectNoTag {
    /** Data */
    [0]: IUnnamedCertMainData;
    /** Signature */
    [1]: Uint8Array;
    /** MultiProof */
    [2]?: Uint8Array[];
}

interface ICertifier {
    type: string;
    curve: string;
    value: Uint8Array;
}

interface ICertMainData {
    target: string;
    fields: string[];
    salt: Uint8Array;
    root: Uint8Array;
    certifier: ICertifier;
}

/**
 *Plain certificate object
 */
export interface ICert extends ISignableObject {
    data: ICertMainData;
    signature: Uint8Array;
    multiProof?: Uint8Array[];
}

interface IDataToCertify {
    [key: string]: string;
}

/**
 * Class for automatic certificate creation, management and transcoding
 */
export class Certificate extends Signable {
    protected _data: ICertMainDataInternal;

    protected _dataToCertify: IDataToCertify = {};

    protected _multiProof: Uint8Array[];

    /**
     * @param dataToCertify - Full data set with keys and values. Needed only for certificate
     * creation and derivation. Can be set later.
     * @param hash - hash algorithm used during merkletree creation
     */
    constructor(
        dataToCertify: IDataToCertify = {},
        hash: TKeyGenAlgorithmValidHashValues = defaultSignHash,
    ) {
        super(hash);
        this._typeTag = TYPE_TAG_VALUE;
        this._data = {
            target: '',
            fields: [],
            salt: new Uint8Array([]),
            root: new Uint8Array([]),
            certifier: new BaseECKey(EmptyKeyParams),
        };
        this._dataToCertify = dataToCertify;
        this._multiProof = [];
    }

    /** Certified fields (keys of data) */
    get fields(): string[] {
        return this._data.fields;
    }

    /** Certified fields (keys of data) */
    set fields(newFields: string[]) {
        this._data.fields = newFields;
    }

    setFields(newFields: string[]) {
        this.fields = newFields;
        return this;
    }

    /** Salt to append to data during merkle tree creation. */
    get salt(): Uint8Array {
        return this._data.salt;
    }

    /** Salt to append to data during merkle tree creation. */
    set salt(newSalt: Uint8Array) {
        this._data.salt = newSalt;
    }

    /** Salt to append to data during merkle tree creation. */
    get saltHex(): string {
        return hexEncode(this.salt);
    }

    /** Salt to append to data during merkle tree creation. */
    set saltHex(newSalt: string) {
        this.salt = hexDecode(newSalt);
    }

    /** Salt to append to data during merkle tree creation. */
    setSalt(newSalt: Uint8Array | string) {
        if (typeof newSalt === 'string') {
            this.saltHex = newSalt;
        } else {
            this.salt = newSalt;
        }
        return this;
    }

    /** Merkle tree root */
    get root(): Uint8Array {
        return this._data.root;
    }

    /** Merkle tree root */
    set root(newRoot: Uint8Array) {
        this._data.root = newRoot;
    }

    /** Merkle tree root */
    setRoot(newRoot: Uint8Array) {
        this.root = newRoot;
        return this;
    }

    /** Certifier's public key. Gets set automatically when signed. */
    get certifier(): BaseECKey {
        return this._data.certifier;
    }

    /** Certifier's public key. Gets set automatically when signed. */
    set certifier(publicKey: BaseECKey) {
        this._data.certifier = publicKey;
    }

    /** Certifier's public key. Gets set automatically when signed. */
    setCertifier(publicKey: BaseECKey) {
        this.certifier = publicKey;
        return this;
    }

    /** Id of the account, whose data are getting certified */
    get target(): string {
        return this._data.target;
    }

    /** Id of the account, whose data are getting certified */
    set target(newTarget: string) {
        this._data.target = newTarget;
    }

    /** Id of the account, whose data are getting certified */
    setTarget(newTarget: string) {
        this.target = newTarget;
        return this;
    }

    /** Full data set with keys and values. Needed only for certificate creation and derivation. */
    get dataToCertify(): IDataToCertify {
        return this._dataToCertify;
    }

    /** Full data set with keys and values. Needed only for certificate creation and derivation. */
    set dataToCertify(dataToCertify: IDataToCertify) {
        this._dataToCertify = dataToCertify;
    }

    /** Full data set with keys and values. Needed only for certificate creation and derivation. */
    setDataToCertify(dataToCertify: IDataToCertify) {
        this.dataToCertify = dataToCertify;
        return this;
    }

    /** Additional (not signed) data, needed for merkle tree reconstruction in partial (derived)
     * certificates. */
    get multiProof(): Uint8Array[] {
        return this._multiProof;
    }

    /** Additional (not signed) data, needed for merkle tree reconstruction in partial (derived)
     * certificates. */
    set multiProof(multiProof: Uint8Array[]) {
        this._multiProof = multiProof;
    }

    /** Additional (not signed) data, needed for merkle tree reconstruction in partial (derived)
     * certificates. */
    setMultiProof(multiProof: Uint8Array[]) {
        this.multiProof = multiProof;
        return this;
    }

    /**
     * Creates (or derives) a certificate. If only a subset of keys of the full data is provided,
     * special 'multiproof' unsigned data will be appended to certificate
     * in order to rebuild merkle tree.
     * @param fields - determines what data need to be provided in clear in orded to successfully
     * verify.
     * @param generateSalt - when true, will generate missing salt automatically.
     * @returns - true, throws otherwise
     */
    create(fields: string[] = [], generateSalt: boolean = true) {
        const allKeys = Object.keys(this.dataToCertify).sort();

        // temp variable
        let clearFields = fields.sort();
        if (clearFields.length === 0) {
            clearFields = allKeys;
        }

        const clearIndexes: number[] = [];
        for (let i = 0; i < clearFields.length; i += 1) {
            const index: number = allKeys.indexOf(clearFields[i]);
            if (index === -1) {
                throw new Error(`${Errors.CERT_INVALID_FIELDS} "${clearFields[i]}" does not exist.`);
            }
            if (clearIndexes[clearIndexes.length - 1] !== index) {
                clearIndexes.push(index);
            }
        }
        this.fields = allKeys;
        if (this.salt.length === 0 && generateSalt) {
            const newSalt = new Uint8Array(DEF_SALT_BYTE_LEN);
            WebCrypto.getRandomValues(newSalt);
            this.salt = newSalt;
        }
        const leaves: Uint8Array[] = [];
        for (let i = 0; i < allKeys.length; i += 1) {
            leaves.push(createLeaf(allKeys[i], this._dataToCertify[allKeys[i]], this._data.salt));
        }

        const missingLeaves = missingSymmetryLeaves(leaves.length);
        const needMultiproof = clearIndexes.length !== leaves.length;
        if (missingLeaves) {
            const leaveToDuplicate = leaves[leaves.length - 1];
            for (let i = 0; i < missingLeaves; i += 1) {
                leaves.push(leaveToDuplicate);
            }
        }
        const merkleData = createMerkleTree(leaves, clearIndexes);
        this.root = merkleData.root;
        if (needMultiproof) {
            this.multiProof = merkleData.multiProof;
        } else {
            this.multiProof = [];
        }
        return this;
    }

    /**
     * Converts certificate to a compact object with unnamed members
     * @returns - object, throws otherwise
     */
    public toUnnamedObject(): Promise<IUnnamedCert> {
        return new Promise((resolve, reject) => {
            const resultObj: IUnnamedCert = [
                this._typeTag,
                [
                    this.target,
                    this.fields,
                    this.salt,
                    this.root,
                    [
                        '',
                        '',
                        new Uint8Array([]),
                    ],
                ],
                this.signature,
            ];
            if (this.multiProof.length !== 0) {
                resultObj[3] = this.multiProof;
            }
            if (this.certifier.paramsId === EKeyParamsIds.EMPTY) {
                return resolve(resultObj);
            }
            this.certifier.getRaw()
                .then((rawKeyBytes: Uint8Array) => {
                    const undrscrIndex = this.certifier.paramsId.indexOf('_');
                    if (undrscrIndex > -1) {
                        resultObj[1][4][0] = this.certifier.paramsId.slice(0, undrscrIndex);
                        resultObj[1][4][1] = this.certifier.paramsId.slice(undrscrIndex + 1);
                    } else {
                        resultObj[1][4][0] = this.certifier.paramsId;
                    }
                    resultObj[1][4][2] = rawKeyBytes;
                    return resolve(resultObj);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    public toUnnamedObjectNoTag(): Promise<IUnnamedCertNoTag> {
        return new Promise((resolve, reject) => {
            const resultObj: IUnnamedCertNoTag = [
                [
                    this.target,
                    this.fields,
                    this.salt,
                    this.root,
                    [
                        '',
                        '',
                        new Uint8Array([]),
                    ],
                ],
                this.signature,
            ];
            if (this.multiProof.length !== 0) {
                resultObj[2] = this.multiProof;
            }
            if (this.certifier.paramsId === EKeyParamsIds.EMPTY) {
                return resolve(resultObj);
            }
            this.certifier.getRaw()
                .then((rawKeyBytes: Uint8Array) => {
                    const undrscrIndex = this.certifier.paramsId.indexOf('_');
                    if (undrscrIndex > -1) {
                        resultObj[0][4][0] = this.certifier.paramsId.slice(0, undrscrIndex);
                        resultObj[0][4][1] = this.certifier.paramsId.slice(undrscrIndex + 1);
                    } else {
                        resultObj[0][4][0] = this.certifier.paramsId;
                    }
                    resultObj[0][4][2] = rawKeyBytes;
                    return resolve(resultObj);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /**
     * Converts certificate to an object with binary members represented by Buffers
     * @returns - object, throws otherwise
     */
    public toObject(): Promise<ICert> {
        return new Promise((resolve, reject) => {
            this.toUnnamedObject()
                .then((unnamedObject: IUnnamedCert) => {
                    const resultObj: ICert = {
                        type: unnamedObject[0],
                        data: {
                            target: unnamedObject[1][0],
                            fields: unnamedObject[1][1],
                            salt: unnamedObject[1][2],
                            root: unnamedObject[1][3],
                            certifier: {
                                type: unnamedObject[1][4][0],
                                curve: unnamedObject[1][4][1],
                                value: unnamedObject[1][4][2],
                            },
                        },
                        signature: unnamedObject[2],
                    };
                    if (unnamedObject.length === 4) {
                        resultObj.multiProof = unnamedObject[3];
                    }
                    return resolve(resultObj);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    public toBytes(): Promise<Uint8Array> {
        return new Promise((resolve, reject) => {
            this.toUnnamedObjectNoTag()
                .then((unnamedObj: IUnnamedCertNoTag) => {
                    return resolve(objectToBytes(unnamedObj));
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /**
     * Converts a compact object with unnamed members to certificate
     * @param passedObj - compact object
     * @returns - true, throws otherwise
     */
    public fromUnnamedObject(passedObj: IUnnamedCert): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (typeof passedObj[0] !== 'string') {
                passedObj.unshift(TYPE_TAG_VALUE);
            }
            this.typeTag = passedObj[0];
            this.target = passedObj[1][0];
            this.fields = passedObj[1][1];
            this.salt = passedObj[1][2];
            this.root = passedObj[1][3];

            let keyParamsId: string = passedObj[1][4][0];
            if (passedObj[1][4][1].length > 0) {
                keyParamsId += `_${passedObj[1][4][1]}`;
            }
            if (!mKeyPairParams.has(keyParamsId)) {
                return reject(new Error(Errors.IMPORT_TYPE_ERROR));
            }
            this.certifier = new BaseECKey(
                mKeyPairParams.get(keyParamsId)!.publicKey,
            );
            this.signature = passedObj[2];
            if (typeof passedObj[3] !== 'undefined') {
                for (let i = 0; i < passedObj[3].length; i += 1) {
                    this.multiProof.push(passedObj[3][i]);
                }
            }
            if (this.certifier.paramsId === EKeyParamsIds.EMPTY) {
                return resolve(true);
            }
            this.certifier.importBin(new Uint8Array(passedObj[1][4][2]))
                .then(() => {
                    return resolve(true);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    public fromUnnamedObjectNoTag(passedObj: IUnnamedCertNoTag): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.target = passedObj[0][0];
            this.fields = passedObj[0][1];
            this.salt = passedObj[0][2];
            this.root = passedObj[0][3];

            let keyParamsId: string = passedObj[0][4][0];
            if (passedObj[0][4][1].length > 0) {
                keyParamsId += `_${passedObj[0][4][1]}`;
            }
            if (!mKeyPairParams.has(keyParamsId)) {
                return reject(new Error(Errors.IMPORT_TYPE_ERROR));
            }
            this.certifier = new BaseECKey(
                mKeyPairParams.get(keyParamsId)!.publicKey,
            );
            this.signature = passedObj[1];
            if (typeof passedObj[2] !== 'undefined') {
                for (let i = 0; i < passedObj[2].length; i += 1) {
                    this._multiProof.push(passedObj[2][i]);
                }
            }
            if (this.certifier.paramsId === EKeyParamsIds.EMPTY) {
                return resolve(true);
            }
            this.certifier.importBin(new Uint8Array(passedObj[0][4][2]))
                .then(() => {
                    return resolve(true);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /**
     * Converts an object with buffers to certificate
     * @param passedObj - object with buffers
     * @returns - true, throws otherwise
     */
    public fromObject(passedObj: ICert): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const unnamedObject: IUnnamedCert = [
                TYPE_TAG_VALUE,
                [
                    passedObj.data.target,
                    passedObj.data.fields,
                    passedObj.data.salt,
                    passedObj.data.root,
                    [
                        passedObj.data.certifier.type,
                        passedObj.data.certifier.curve,
                        passedObj.data.certifier.value,
                    ],
                ],
                passedObj.signature,
            ];
            if (typeof passedObj.multiProof !== 'undefined') {
                unnamedObject.push(passedObj.multiProof);
            }
            this.fromUnnamedObject(unnamedObject)
                .then((result: boolean) => {
                    return resolve(result);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    public fromBytes(bytes: Uint8Array): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const unnamedObj: IUnnamedCertNoTag = bytesToObject(bytes);
            this.fromUnnamedObjectNoTag(unnamedObj)
                .then((result) => {
                    return resolve(result);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /**
     * Signs certificate with private key, provided by
     * the gived key pair. This also automatically sets
     * certifier of this certificate.
     * @param privateKey - signer's private key
     * @returns - true, throws otherwise
    */
    public sign(privateKey: BaseECKey): Promise<boolean> {
        return new Promise((resolve, reject) => {
            privateKey.extractPublic()
                .then((publicKey: BaseECKey) => {
                    this.certifier = publicKey;
                    super.sign(privateKey)
                        .then(() => {
                            return resolve(true);
                        })
                        .catch((error: any) => {
                            return reject(error);
                        });
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /**
     * Verifies merkle tree and signature.
     * @param clearData - Provided data.
     * @returns - boolean
     */
    public verify(clearData: IDataToCertify = {}): Promise<boolean> {
        return new Promise((resolve, reject) => {
            super.verifySignature(this.certifier)
                .then((signatureIsValid: boolean) => {
                    if (!signatureIsValid) {
                        return resolve(signatureIsValid);
                    }

                    const clearKeys: string[] = Object.keys(clearData).sort();
                    const allKeys = this.fields;
                    allKeys.sort();
                    if (
                        clearKeys.length !== allKeys.length
                        && (
                            this.multiProof.length === 0
                            || clearKeys.length === 0
                        )
                    ) {
                        return resolve(false);
                    }
                    for (let i = 0; i < clearKeys.length; i += 1) {
                        if (allKeys.indexOf(clearKeys[i]) < 0) {
                            return reject(
                                new Error(
                                    `${Errors.CERT_INVALID_FIELDS} "${clearKeys[i]}" does not exist.`,
                                ),
                            );
                        }
                    }

                    const clearLeaves: Uint8Array[] = [];
                    const clearIndexes: number[] = [];
                    for (let i = 0; i < allKeys.length; i += 1) {
                        if (clearKeys.indexOf(allKeys[i]) >= 0) {
                            clearIndexes.push(i);
                            clearLeaves.push(
                                createLeaf(
                                    allKeys[i],
                                    clearData[allKeys[i]],
                                    this.salt,
                                ),
                            );
                        }
                    }

                    let totalLeaves = allKeys.length;
                    const missingSymLeaves = missingSymmetryLeaves(allKeys.length);
                    totalLeaves += missingSymLeaves;

                    // create missing leaves only if all data was provided.
                    // otherwise multiproof should contain missing links
                    if (clearIndexes.length === allKeys.length) {
                        // do it only if passed tree is asymmetrical
                        if (missingSymLeaves) {
                            const leafToDublicate = clearLeaves[clearLeaves.length - 1];
                            const idxStart = clearLeaves.length;
                            for (let i = 0; i < missingSymLeaves; i += 1) {
                                clearLeaves.push(leafToDublicate);
                                clearIndexes.push(idxStart + i);
                            }
                        }
                    }

                    let result = false;
                    try {
                        result = verifyMerkleTree(
                            clearLeaves,
                            clearIndexes,
                            totalLeaves,
                            this.root,
                            this.multiProof,
                        );
                    } catch (error) {
                        return resolve(false);
                    }
                    return resolve(result);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }
}
