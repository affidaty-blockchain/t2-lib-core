import { WebCrypto, Subtle } from '../cryptography/webCrypto';
import { fromHex, toHex } from '../binConversions';
import {
    stringIsTrinciAccount,
    sha256,
    objectToBytes,
    bytesToObject,
} from '../utils';
import { jsonParse } from '../json';
import { BaseECKey } from '../cryptography/baseECKey';

export const TxSchemas: {
    EMPTY_TX: '',
    UNITARY_TX: 'd8af8f563f25eb065651ccdd05b9726fd27ff9dc40e3b9c8b4d2c55fa9819f36',
    BULK_TX: '0ec3469e3509682d7599797a9d1c5cdf56b2d9bd435f853a3b999cbb717e0337',
    BULK_ROOT_TX: '0bccf5dce4f25036de1ef091ea9e862fa348e6de82ef16fbcfc84c1f1314b86e',
    BULK_NODE_TX: '097e5f552c79d4f64e15f853ad19d013973343aea557d5c1482d9cef71915db8',
    BULK_EMPTY_ROOT_TX: 'f76bce109213ee2204e218f000b7c67770812e4b26f4dba90c532a10865968ff',
} = {
    EMPTY_TX: '',
    UNITARY_TX: 'd8af8f563f25eb065651ccdd05b9726fd27ff9dc40e3b9c8b4d2c55fa9819f36',
    BULK_TX: '0ec3469e3509682d7599797a9d1c5cdf56b2d9bd435f853a3b999cbb717e0337',
    BULK_ROOT_TX: '0bccf5dce4f25036de1ef091ea9e862fa348e6de82ef16fbcfc84c1f1314b86e',
    BULK_NODE_TX: '097e5f552c79d4f64e15f853ad19d013973343aea557d5c1482d9cef71915db8',
    BULK_EMPTY_ROOT_TX: 'f76bce109213ee2204e218f000b7c67770812e4b26f4dba90c532a10865968ff',
};

export const SignableTypeTags: {
    EMPTY_TX: '',
    UNITARY_TX: 'unit_tx',
    BULK_TX: 'bulk_tx',
    BULK_ROOT_TX: 'bulk_root_tx',
    BULK_NODE_TX: 'bulk_node_tx',
    BULK_EMPTY_ROOT_TX: 'bulk_empty_root_tx',
} = {
    EMPTY_TX: '',
    UNITARY_TX: 'unit_tx',
    BULK_TX: 'bulk_tx',
    BULK_ROOT_TX: 'bulk_root_tx',
    BULK_NODE_TX: 'bulk_node_tx',
    BULK_EMPTY_ROOT_TX: 'bulk_empty_root_tx',
};

export const SCHEMA_TO_TYPE_TAG_MAP = new Map<string, string>();
SCHEMA_TO_TYPE_TAG_MAP.set(TxSchemas.EMPTY_TX, SignableTypeTags.EMPTY_TX);
SCHEMA_TO_TYPE_TAG_MAP.set(TxSchemas.UNITARY_TX, SignableTypeTags.UNITARY_TX);
SCHEMA_TO_TYPE_TAG_MAP.set(TxSchemas.BULK_TX, SignableTypeTags.BULK_TX);
SCHEMA_TO_TYPE_TAG_MAP.set(TxSchemas.BULK_ROOT_TX, SignableTypeTags.BULK_ROOT_TX);
SCHEMA_TO_TYPE_TAG_MAP.set(TxSchemas.BULK_EMPTY_ROOT_TX, SignableTypeTags.BULK_EMPTY_ROOT_TX);
SCHEMA_TO_TYPE_TAG_MAP.set(TxSchemas.BULK_NODE_TX, SignableTypeTags.BULK_NODE_TX);

const DEFAULT_SCHEMA = TxSchemas.EMPTY_TX;

export interface ICommonParentTxDataUnnamedObject extends Array<any> {
    /** Transaction schema */
    [0]: string;
    [key: number]: any;
}

export interface ICommonParentTxDataObject extends Object {
    /** Transaction schema */
    schema: string;
}

export class CommonParentTxData {
    private _typeTag: string;

    private _schema: string;

    private _target: string;

    private _maxFuel: number;

    private _nonce: Uint8Array;

    private _network: string;

    private _contract: Uint8Array | null;

    private _method: string;

    private _args: Uint8Array;

    private _dependsOn: Uint8Array;

    private _signerPubKey: BaseECKey;

    constructor(schema: string = DEFAULT_SCHEMA) {
        if (!SCHEMA_TO_TYPE_TAG_MAP.has(schema)) {
            throw new Error(`Unknown schema: ${schema}`);
        }
        this._typeTag = SCHEMA_TO_TYPE_TAG_MAP.get(schema)!;
        this._schema = schema;
        this._target = '';
        this._maxFuel = 0;
        this._nonce = new Uint8Array([]);
        this._network = '';
        this._contract = null;
        this._method = '';
        this._args = new Uint8Array([]);
        this._dependsOn = new Uint8Array([]);
        this._signerPubKey = new BaseECKey();
        if (
            this._typeTag !== SignableTypeTags.EMPTY_TX
            && this._typeTag !== SignableTypeTags.BULK_TX
        ) {
            this.genNonce();
        }
    }

    get typeTag(): string {
        return this._typeTag;
    }

    set typeTag(newTypeTag: string) {
        this._typeTag = newTypeTag;
    }

    setTypeTag(newTypeTag: string) {
        this.typeTag = newTypeTag;
        return this;
    }

    /** Reference to the default schema used in this data type. */
    static get defaultSchema(): string {
        return DEFAULT_SCHEMA;
    }

    /** Reference to the schema used in this data type. */
    get schema() {
        return this._schema;
    }

    /** Reference to the schema used in this data type. */
    set schema(newSchema: string) {
        if (!SCHEMA_TO_TYPE_TAG_MAP.has(newSchema)) {
            throw new Error(`Unknown schema: "${newSchema}"`);
        }
        this._schema = newSchema;
    }

    /** Reference to the schema used in this data type. */
    setSchema(newSchema: string) {
        this.schema = newSchema;
        return this;
    }

    /** Account ID of the target (receiving account) of the transaction. */
    get target(): string {
        return this._target;
    }

    /** Account ID of the target (receiving account) of the transaction. */
    set target(accountId: string) {
        if (!stringIsTrinciAccount(accountId) && this.schema !== TxSchemas.BULK_EMPTY_ROOT_TX) {
            throw new Error(`String "${accountId}" is not a valid TRINCI account.`);
        }
        this._target = accountId;
    }

    /** Account ID of the target (receiving account) of the transaction. */
    setTarget(accountId: string) {
        this.target = accountId;
        return this;
    }

    /** Account ID of the target (receiving account) of the transaction.
     * @deprecated
     */
    get accountId(): string {
        return this.target;
    }

    /** Account ID of the target (receiving account) of the transaction.
     * @deprecated
     */
    set accountId(accountId: string) {
        this.target = accountId;
    }

    /** Maximum amount of fuel that sender is ready to burn for this transaction. */
    get maxFuel(): number {
        return this._maxFuel;
    }

    /** Maximum amount of fuel that sender is ready to burn for this transaction. */
    set maxFuel(maxFuel: number) {
        this._maxFuel = Math.floor(maxFuel);
    }

    /** Maximum amount of fuel that sender is ready to burn for this transaction. */
    setMaxFuel(maxFuel: number | string) {
        if (typeof maxFuel === 'string') {
            this.maxFuel = parseInt(maxFuel, 10);
        } else {
            this.maxFuel = maxFuel;
        }
        return this;
    }

    /** Random 8-bytes value as an anti-replay protection(Uint8Array). */
    get nonce(): Uint8Array {
        return this._nonce;
    }

    /** Random 8-bytes value as an anti-replay protection(Uint8Array). */
    set nonce(nonce: Uint8Array) {
        // if (nonce.length !== 8) {
        //     throw new Error(Errors.WRONG_TX_NONCE_LENGTH);
        // }
        this._nonce = nonce;
    }

    /** Random 8-bytes value as an anti-replay protection(hex string). */
    get nonceHex(): string {
        return toHex(this.nonce);
    }

    /** Random 8-bytes value as an anti-replay protection(hex string). */
    set nonceHex(nonce: string) {
        this.nonce = fromHex(nonce.padStart(16, '0'));
    }

    /** Random 8-bytes value as an anti-replay protection(Uint8Array).
     * @param nonce - Byte array or hex string
    */
    setNonce(nonce: Uint8Array | string) {
        if (typeof nonce === 'string') {
            this.nonceHex = nonce;
        } else {
            this.nonce = nonce;
        }
        return this;
    }

    /** Automatically generates and sets new random nonce. */
    genNonce() {
        const newNonce = new Uint8Array(8);
        WebCrypto.getRandomValues(newNonce);
        this.nonce = newNonce;
        return this;
    }

    /** Name of the network to which the transaction is addressed. */
    get networkName(): string {
        return this._network;
    }

    /** Name of the network to which the transaction is addressed. */
    set networkName(networkName: string) {
        this._network = networkName;
    }

    /** Name of the network to which the transaction is addressed. */
    setNetworkName(networkName: string) {
        this.networkName = networkName;
        return this;
    }

    /** Smart contract hash, which will be invoked on target account. */
    get smartContractHash(): Uint8Array {
        if (this._contract) {
            return this._contract;
        }
        return new Uint8Array([]);
    }

    /** Smart contract hash, which will be invoked on target account. */
    set smartContractHash(hash: Uint8Array | null) {
        const expectedByteLen = 34;
        if (hash && hash.length > 0) {
            if (hash.length !== expectedByteLen) {
                throw new Error(`Incorrect smart contract hash length: ${toHex(hash)}. Expected ${expectedByteLen} received ${hash.length}.`);
            }
            this._contract = hash;
        } else {
            this._contract = null;
        }
    }

    /** Smart contract hash, which will be invoked on target account(hex string). */
    get smartContractHashHex(): string {
        return toHex(this.smartContractHash);
    }

    /** Smart contract hash, which will be invoked on target account(hex string). */
    set smartContractHashHex(hash: string) {
        this.smartContractHash = fromHex(hash);
    }

    /** Smart contract hash, which will be invoked on target account. */
    setSmartContractHash(hash?: Uint8Array | string) {
        if (typeof hash === 'undefined') {
            this.smartContractHash = null;
        } else if (typeof hash === 'string') {
            this.smartContractHashHex = hash;
        } else {
            this.smartContractHash = hash;
        }
        return this;
    }

    /** Method to call on the invoked smart contract */
    get smartContractMethod(): string {
        return this._method;
    }

    /** Method to call on the invoked smart contract */
    set smartContractMethod(method: string) {
        if (!method.length && this.schema !== TxSchemas.BULK_EMPTY_ROOT_TX) {
            throw new Error('Cannot set empty method.');
        }
        this._method = method;
    }

    /** Method to call on the invoked smart contract */
    setSmartContractMethod(method: string) {
        this.smartContractMethod = method;
        return this;
    }

    /** Arguments that will be passed to invoked smart contract method (Uint8Array) */
    get smartContractMethodArgsBytes(): Uint8Array {
        return this._args;
    }

    /** Arguments that will be passed to invoked smart contract method (Uint8Array) */
    set smartContractMethodArgsBytes(passedArgs: Uint8Array) {
        this._args = passedArgs;
    }

    /** Arguments that will be passed to invoked smart contract method (Uint8Array) */
    setSmartContractMethodArgsBytes(passedArgs: Uint8Array) {
        this.smartContractMethodArgsBytes = passedArgs;
        return this;
    }

    /** Arguments that will be passed to invoked smart contract method (hex string) */
    get smartContractMethodArgsHex(): string {
        return toHex(this.smartContractMethodArgsBytes);
    }

    /** Arguments that will be passed to invoked smart contract method (hex string) */
    set smartContractMethodArgsHex(passedArgs: string) {
        this.smartContractMethodArgsBytes = fromHex(passedArgs);
    }

    /** Arguments that will be passed to invoked smart contract method (hex string) */
    setSmartContractMethodArgsHex(passedArgs: string) {
        this.smartContractMethodArgsHex = passedArgs;
        return this;
    }

    /** Arguments that will be passed to invoked smart contract method (generic js object) */
    get smartContractMethodArgs(): any {
        if (!this.smartContractMethodArgsBytes.length) {
            throw new Error('Cannot decode empty args byte array.');
        }
        return bytesToObject(this.smartContractMethodArgsBytes);
    }

    /** Arguments that will be passed to invoked smart contract method (generic js object) */
    set smartContractMethodArgs(passedArgs: any) {
        this.smartContractMethodArgsBytes = objectToBytes(passedArgs);
    }

    /** Arguments that will be passed to invoked smart contract method (generic js object) */
    setSmartContractMethodArgs(passedArgs: any) {
        this.smartContractMethodArgs = passedArgs;
        return this;
    }

    /** Arguments that will be passed to invoked smart contract method (json string) */
    get smartContractMethodArgsJson() {
        return JSON.stringify(this.smartContractMethodArgs);
    }

    /** Arguments that will be passed to invoked smart contract method (json string) */
    set smartContractMethodArgsJson(jsonStr: string) {
        this.smartContractMethodArgs = jsonParse(jsonStr);
    }

    /** Arguments that will be passed to invoked smart contract method (json string) */
    setSmartContractMethodArgsJson(jsonStr: string) {
        this.smartContractMethodArgsJson = jsonStr;
        return this;
    }

    /** Hash of the bulk root transaction on which this one depends. */
    get dependsOn(): Uint8Array {
        return this._dependsOn;
    }

    /** Hash of the bulk root transaction on which this one depends. */
    set dependsOn(hash: Uint8Array) {
        const expectedByteLen = 34;
        if (hash.length !== 34 && hash.length !== 0) {
            throw new Error(`Incorrect transaction hash length: ${hash}. Expected ${expectedByteLen} received ${hash.length}.`);
        }
        this._dependsOn = hash;
    }

    /** Hash of the bulk root transaction on which this one depends as hex string. */
    get dependsOnHex(): string {
        return toHex(this.dependsOn);
    }

    /** Hash of the bulk root transaction on which this one depends as hex string. */
    set dependsOnHex(hash: string) {
        this.dependsOn = fromHex(hash);
    }

    /** Hash of the bulk root transaction on which this one depends. */
    setDependsOn(hash: Uint8Array | string) {
        if (typeof hash === 'string') {
            this.dependsOnHex = hash;
        } else {
            this.dependsOn = hash;
        }
        return this;
    }

    /** Signer's public key. */
    get signerPublicKey(): BaseECKey {
        return this._signerPubKey;
    }

    /* Signer's public key. */
    set signerPublicKey(publicKey: BaseECKey) {
        if (publicKey.type !== 'public') {
            throw new Error('Unknown key type.');
        }
        this._signerPubKey = publicKey;
    }

    /** Signer's public key. */
    setSignerPublicKey(publicKey: BaseECKey) {
        this.signerPublicKey = publicKey;
        return this;
    }

    /**
     * Exports data structure to a compact object with unnamed members,
     * ready to be encoded with msgpack.
     * and sent over the network
     * @returns - compact unnamed object
     */
    toUnnamedObject(): Promise<ICommonParentTxDataUnnamedObject> {
        return new Promise((resolve) => {
            return resolve([this.schema]);
        });
    }

    /**
     * Exports data structure to an object with named members and binary
     * values represented by Uint8Arrays
     * @returns - object with named members and binary values represented by Uint8Arrays
     */
    toObject(): Promise<ICommonParentTxDataObject> {
        return new Promise((resolve, reject) => {
            this.toUnnamedObject()
                .then((unnamedObject: ICommonParentTxDataUnnamedObject) => {
                    return resolve(
                        {
                            schema: unnamedObject[0],
                        },
                    );
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /**
     * Imports data structure from a compact object with unnamed members
     * @returns - compact unnamed object
     */
    fromUnnamedObject(unnamedObj: ICommonParentTxDataUnnamedObject): Promise<boolean> {
        return new Promise((resolve) => {
            this._schema = unnamedObj[0];
            return resolve(true);
        });
    }

    /**
     * Imports data structure from an object with named members and binary
     * values represented by Uint8Arrays
     * @param passedObj - object with named members and binary values represented by Uint8Arrays
     */
    fromObject(passedObj: ICommonParentTxDataObject): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.fromUnnamedObject(
                [
                    passedObj.schema,
                ],
            )
                .then((result: boolean) => {
                    return resolve(result);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /** Computes sha256 of the serialized data structure
     * @returns - sha256 of the serialized data structure
     */
    sha256(): Promise<Uint8Array> {
        return new Promise((resolve, reject) => {
            this.toUnnamedObject()
                .then((unnamedObject: ICommonParentTxDataUnnamedObject) => {
                    return resolve(
                        sha256(
                            objectToBytes(unnamedObject),
                        ),
                    );
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /** Computes sha384 of the serialized data structure
     * @returns - sha384 of the serialized data structure
     */
    sha384(): Promise<Uint8Array> {
        return new Promise((resolve, reject) => {
            this.toUnnamedObject()
                .then((unnamedObject: ICommonParentTxDataUnnamedObject) => {
                    Subtle.digest('SHA-384', objectToBytes(unnamedObject))
                        .then((sha384: ArrayBuffer) => {
                            return resolve(new Uint8Array(sha384));
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

    getTicket(): Promise<string> {
        return new Promise((resolve, reject) => {
            this.toUnnamedObject()
                .then((unnamedDataObj: ICommonParentTxDataUnnamedObject) => {
                    try {
                        const bytes = objectToBytes(unnamedDataObj);
                        const dataHash = sha256(bytes);
                        const ticket = `1220${toHex(dataHash)}`;
                        return resolve(ticket);
                    } catch (error) {
                        return reject(error);
                    }
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }
}
