import * as Errors from '../errors';
import { WebCrypto } from '../cryptography/webCrypto';
import { hexDecode, hexEncode } from '../binConversions';
import { objectToBytes, bytesToObject, sha256 } from '../utils';
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

    private _maxFuel: bigint;

    private _nonce: Uint8Array;

    private _network: string;

    private _contract: Uint8Array | null;

    private _method: string;

    private _args: Uint8Array;

    private _dependsOn: Uint8Array;

    private _signerPubKey: BaseECKey;

    constructor(schema: string = DEFAULT_SCHEMA) {
        this._typeTag = SCHEMA_TO_TYPE_TAG_MAP.has(schema)
            ? SCHEMA_TO_TYPE_TAG_MAP.get(schema)!
            : SignableTypeTags.EMPTY_TX;
        this._schema = schema;
        this._target = '';
        this._maxFuel = BigInt(0);
        this._nonce = new Uint8Array([]);
        this._network = '';
        this._contract = null;
        this._method = '';
        this._args = new Uint8Array([]);
        this._dependsOn = new Uint8Array([]);
        this._signerPubKey = new BaseECKey();
    }

    public set typeTag(typeTag: string) {
        this._typeTag = typeTag;
    }

    public get typeTag(): string {
        return this._typeTag;
    }

    setTypeTag(typeTag: string) {
        this.typeTag = typeTag;
        return this;
    }

    /** Reference to the default schema used in this data type. */
    public static get defaultSchema(): string {
        return DEFAULT_SCHEMA;
    }

    /** Reference to the schema used in this data type. */
    public get schema() {
        return this._schema;
    }

    /** Reference to the schema used in this data type. */
    public set schema(schema: string) {
        if (!SCHEMA_TO_TYPE_TAG_MAP.has(schema)) {
            throw new Error(`Unknown tx schema: "${schema}"`);
        }
        this._schema = schema;
    }

    /** Reference to the schema used in this data type. */
    setSchema(schema: string) {
        this.schema = schema;
        return this;
    }

    /** Account ID of the target (receiving account) of the transaction. */
    public set target(accountId: string) {
        this._target = accountId;
    }

    /** Account ID of the target (receiving account) of the transaction. */
    public get target(): string {
        return this._target;
    }

    /** Account ID of the target (receiving account) of the transaction. */
    setTarget(accountId: string) {
        this.target = accountId;
        return this;
    }

    /** Account ID of the target (receiving account) of the transaction.
     * @deprecated
     */
    public set accountId(accountId: string) {
        this.target = accountId;
    }

    /** Account ID of the target (receiving account) of the transaction.
     * @deprecated
     */
    public get accountId(): string {
        return this.target;
    }

    /** Maximum amount of fuel that sender is ready to burn for this transaction. */
    public set maxFuel(maxFuel: bigint) {
        if (maxFuel < BigInt(0) || maxFuel > BigInt('0xffffffffffffffff')) {
            throw new Error(Errors.FUEL_INCORRECT);
        }
        this._maxFuel = BigInt(maxFuel);
    }

    /** Maximum amount of fuel that sender is ready to burn for this transaction. */
    public get maxFuel(): bigint {
        return this._maxFuel;
    }

    /** Maximum amount of fuel that sender is ready to burn for this transaction. */
    setMaxFuel(maxFuel: number | string) {
        this.maxFuel = BigInt(maxFuel);
        return this;
    }

    /** Random 8-bytes value as an anti-replay protection(Uint8Array). */
    public set nonce(nonce: Uint8Array) {
        if (nonce.byteLength !== 8) {
            throw new Error(Errors.WRONG_TX_NONCE_LENGTH);
        }
        this._nonce = nonce;
    }

    /** Random 8-bytes value as an anti-replay protection(Uint8Array). */
    public get nonce(): Uint8Array {
        return this._nonce;
    }

    /** Random 8-bytes value as an anti-replay protection(hex string). */
    public set nonceHex(nonce: string) {
        this.nonce = hexDecode(nonce.padStart(16, '0'));
    }

    /** Random 8-bytes value as an anti-replay protection(hex string). */
    public get nonceHex(): string {
        return hexEncode(this.nonce);
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
    public genNonce() {
        const newNonce = new Uint8Array(8);
        WebCrypto.getRandomValues(newNonce);
        this.nonce = newNonce;
        return this;
    }

    /** Name of the network to which the transaction is addressed. */
    public set networkName(networkName: string) {
        this._network = networkName;
    }

    /** Name of the network to which the transaction is addressed. */
    public get networkName(): string {
        return this._network;
    }

    /** Name of the network to which the transaction is addressed. */
    setNetworkName(networkName: string) {
        this.networkName = networkName;
        return this;
    }

    /** Smart contract hash, which will be invoked on target account. */
    public set smartContractHash(hash: Uint8Array | null) {
        if (hash && hash.byteLength > 0) {
            this._contract = hash;
        } else {
            this._contract = null;
        }
    }

    /** Smart contract hash, which will be invoked on target account. */
    public get smartContractHash(): Uint8Array {
        if (this._contract) {
            return this._contract;
        }
        return new Uint8Array([]);
    }

    /** Smart contract hash, which will be invoked on target account(hex string). */
    public set smartContractHashHex(hash: string) {
        this.smartContractHash = hexDecode(hash);
    }

    /** Smart contract hash, which will be invoked on target account(hex string). */
    public get smartContractHashHex(): string {
        return hexEncode(this.smartContractHash);
    }

    /** Smart contract hash, which will be invoked on target account. */
    public setSmartContractHash(hash: Uint8Array | string) {
        if (typeof hash === 'string') {
            this.smartContractHashHex = hash;
        } else {
            this.smartContractHash = hash;
        }
        return this;
    }

    /** Method to call on the invoked smart contract */
    public set smartContractMethod(method: string) {
        this._method = method;
    }

    /** Method to call on the invoked smart contract */
    public get smartContractMethod(): string {
        return this._method;
    }

    /** Method to call on the invoked smart contract */
    setSmartContractMethod(method: string) {
        this.smartContractMethod = method;
        return this;
    }

    /** Arguments that will be passed to invoked smart contract method (Uint8Array) */
    public set smartContractMethodArgsBytes(passedArgs: Uint8Array) {
        this._args = passedArgs;
    }

    /** Arguments that will be passed to invoked smart contract method (Uint8Array) */
    public get smartContractMethodArgsBytes(): Uint8Array {
        return this._args;
    }

    /** Arguments that will be passed to invoked smart contract method (Uint8Array) */
    setSmartContractMethodArgsBytes(passedArgs: Uint8Array) {
        this.smartContractMethodArgsBytes = passedArgs;
        return this;
    }

    /** Arguments that will be passed to invoked smart contract method (hex string) */
    public set smartContractMethodArgsHex(passedArgs: string) {
        this.smartContractMethodArgsBytes = hexDecode(passedArgs);
    }

    /** Arguments that will be passed to invoked smart contract method (hex string) */
    public get smartContractMethodArgsHex(): string {
        return hexEncode(this.smartContractMethodArgsBytes);
    }

    /** Arguments that will be passed to invoked smart contract method (hex string) */
    setsmartContractMethodArgsHex(passedArgs: string) {
        this.smartContractMethodArgsHex = passedArgs;
    }

    /** Arguments that will be passed to invoked smart contract method (generic json object) */
    public set smartContractMethodArgs(passedArgs: any) {
        this.smartContractMethodArgsBytes = objectToBytes(passedArgs);
    }

    /** Arguments that will be passed to invoked smart contract method (generic json object) */
    public get smartContractMethodArgs(): any {
        return bytesToObject(this.smartContractMethodArgsBytes);
    }

    /** Arguments that will be passed to invoked smart contract method (generic json object) */
    setSmartContractMethodArgs(passedArgs: any) {
        this.smartContractMethodArgs = passedArgs;
        return this;
    }

    /** Arguments that will be passed to invoked smart contract method (json string) */
    public set smartContractMethodArgsJson(jsonStr: string) {
        this.smartContractMethodArgs = jsonParse(jsonStr);
    }

    /** Arguments that will be passed to invoked smart contract method (json string) */
    setSmartContractMethodArgsJson(jsonStr: string) {
        this.smartContractMethodArgsJson = jsonStr;
        return this;
    }

    /** Hash of the bulk root transaction on which this one depends. */
    public set dependsOn(hash: Uint8Array) {
        this._dependsOn = hash;
    }

    /** Hash of the bulk root transaction on which this one depends. */
    public get dependsOn(): Uint8Array {
        return this._dependsOn;
    }

    /** Hash of the bulk root transaction on which this one depends as hex string. */
    public set dependsOnHex(hash: string) {
        this.dependsOn = hexDecode(hash);
    }

    /** Hash of the bulk root transaction on which this one depends as hex string. */
    public get dependsOnHex(): string {
        return hexEncode(this.dependsOn);
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
    public set signerPublicKey(publicKey: BaseECKey) {
        this._signerPubKey = publicKey;
    }

    /** Signer's public key. */
    public get signerPublicKey(): BaseECKey {
        return this._signerPubKey;
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
    public toUnnamedObject(): Promise<ICommonParentTxDataUnnamedObject> {
        return new Promise((resolve) => {
            return resolve([this.schema]);
        });
    }

    /**
     * Exports data structure to an object with named members and binary
     * values represented by Uint8Arrays
     * @returns - object with named members and binary values represented by Uint8Arrays
     */
    public toObject(): Promise<ICommonParentTxDataObject> {
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
    public fromUnnamedObject(unnamedObj: ICommonParentTxDataUnnamedObject): Promise<boolean> {
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
    public fromObject(passedObj: ICommonParentTxDataObject): Promise<boolean> {
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
    public sha256(): Promise<Uint8Array> {
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

    public getTicket(): Promise<string> {
        return new Promise((resolve, reject) => {
            this.toUnnamedObject()
                .then((unnamedDataObj: ICommonParentTxDataUnnamedObject) => {
                    try {
                        const dataHash = sha256(objectToBytes(unnamedDataObj));
                        const ticket = `1220${Buffer.from(dataHash).toString('hex')}`;
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
