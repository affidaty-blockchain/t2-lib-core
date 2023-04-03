import * as Errors from '../errors';
import { TKeyGenAlgorithmValidHashValues } from '../cryptography/baseTypes';
import {
    DEF_SIGN_HASH_ALGORITHM as defaultSignHash,
} from '../cryptography/cryptoDefaults';
import { BaseECKey } from '../cryptography/baseECKey';
import {
    CommonParentTxData,
    ICommonParentTxDataUnnamedObject,
    ICommonParentTxDataObject,
} from './commonParentTxData';
import {
    BaseTxData,
} from './baseTxData';
import {
    Signable,
    ISignableObject,
    ISignableUnnamedObject,
    ISignableUnnamedObjectNoTag,
} from '../signable';

export type TSchemaToDataMap = Map<string, (schema?: string)=>CommonParentTxData>;

export interface IBaseTxUnnamedObject extends ISignableUnnamedObject {
    [1]: ICommonParentTxDataUnnamedObject,
    [2]?: Uint8Array;
}

export interface IBaseTxUnnamedObjectNoTag extends ISignableUnnamedObjectNoTag {
    [0]: ICommonParentTxDataUnnamedObject,
    [1]?: Uint8Array;
}

/**
 * Structure returned by Transaction.toObject() method.
 */
export interface IBaseTxObject extends ISignableObject {
    data: ICommonParentTxDataObject,
    signature?: Uint8Array;
}

/**
 * Class for automatic transaction creation, management and transcoding
 */
export class BaseTransaction extends Signable {
    protected _schemaClassMap: TSchemaToDataMap;

    protected _data: CommonParentTxData;

    constructor(
        schema: string = BaseTxData.defaultSchema,
        hash: TKeyGenAlgorithmValidHashValues = defaultSignHash,
    ) {
        super(hash);
        this._schemaClassMap = new Map();
        this._data = new CommonParentTxData(schema);
        this._typeTag = this._data.typeTag;
    }

    protected get schemaClassMap(): TSchemaToDataMap {
        return this._schemaClassMap;
    }

    protected set schemaClassMap(schemaClassMap: TSchemaToDataMap) {
        this._schemaClassMap = schemaClassMap;
    }

    protected setSchemaClassMap(schemaClassMap: TSchemaToDataMap) {
        this.schemaClassMap = schemaClassMap;
        return this;
    }

    protected setSchema(schema: string) {
        this.data.setSchema(schema);
        return this;
    }

    get target() {
        return this._data.target;
    }

    set target(accountId: string) {
        this._data.target = accountId;
    }

    setTarget(accountId: string) {
        this._data.setTarget(accountId);
        return this;
    }

    get maxFuel() {
        return this._data.maxFuel;
    }

    set maxFuel(maxFuel: bigint) {
        this._data.maxFuel = maxFuel;
    }

    setMaxFuel(maxFuel: string | number | bigint) {
        this.data.setMaxFuel(maxFuel);
        return this;
    }

    get networkName() {
        return this._data.networkName;
    }

    set networkName(networkName: string) {
        this._data.networkName = networkName;
    }

    setNetworkName(networkName: string) {
        this._data.setNetworkName(networkName);
        return this;
    }

    get nonce() {
        return this._data.nonce;
    }

    set nonce(nonce: Uint8Array) {
        this._data.nonce = nonce;
    }

    get nonceHex() {
        return this._data.nonceHex;
    }

    set nonceHex(nonceHex: string) {
        this._data.nonceHex = nonceHex;
    }

    setNonce(nonce: string | Uint8Array) {
        this._data.setNonce(nonce);
        return this;
    }

    genNonce() {
        this._data.genNonce();
        return this;
    }

    get smartContractHash() {
        return this._data.smartContractHash;
    }

    set smartContractHash(hash: Uint8Array) {
        this._data.smartContractHash = hash;
    }

    get smartContractHashHex() {
        return this._data.smartContractHashHex;
    }

    set smartContractHashHex(hashHex: string) {
        this._data.smartContractHashHex = hashHex;
    }

    setSmartContractHash(contractHash?: string | Uint8Array) {
        this._data.setSmartContractHash(contractHash);
        return this;
    }

    get smartContractMethod() {
        return this._data.smartContractMethod;
    }

    set smartContractMethod(method: string) {
        this._data.smartContractMethod = method;
    }

    setSmartContractMethod(method: string) {
        this._data.setSmartContractMethod(method);
        return this;
    }

    get smartContractMethodArgs() {
        return this._data.smartContractMethodArgs;
    }

    set smartContractMethodArgs(args: any) {
        this._data.smartContractMethodArgs = args;
    }

    setSmartContractMethodArgs(args: any) {
        this._data.setSmartContractMethodArgs(args);
        return this;
    }

    get smartContractMethodArgsBytes() {
        return this._data.smartContractMethodArgsBytes;
    }

    set smartContractMethodArgsBytes(argsBytes: Uint8Array) {
        this._data.smartContractMethodArgsBytes = argsBytes;
    }

    setSmartContractMethodArgsBytes(args: Uint8Array) {
        this._data.setSmartContractMethodArgsBytes(args);
        return this;
    }

    get smartContractMethodArgsHex() {
        return this._data.smartContractMethodArgsHex;
    }

    set smartContractMethodArgsHex(argsHex: string) {
        this._data.smartContractMethodArgsHex = argsHex;
    }

    setSmartContractMethodArgsHex(args: string) {
        this._data.setSmartContractMethodArgsHex(args);
        return this;
    }

    get smartContractMethodArgsJson() {
        return this._data.smartContractMethodArgsJson;
    }

    set smartContractMethodArgsJson(argsJson: string) {
        this._data.smartContractMethodArgsJson = argsJson;
    }

    setSmartContractMethodArgsJson(args: string) {
        this._data.setSmartContractMethodArgsJson(args);
        return this;
    }

    get dependsOn() {
        return this._data.dependsOn;
    }

    set dependsOn(txHash: Uint8Array) {
        this._data.dependsOn = txHash;
    }

    get dependsOnHex() {
        return this._data.dependsOnHex;
    }

    set dependsOnHex(txHash: string) {
        this._data.dependsOnHex = txHash;
    }

    setDependsOn(txHash: string | Uint8Array) {
        this._data.setDependsOn(txHash);
        return this;
    }

    get signerPublicKey() {
        return this._data.signerPublicKey;
    }

    set signerPublicKey(signerPublicKey: BaseECKey) {
        this._data.signerPublicKey = signerPublicKey;
    }

    setSignerPublicKey(signerPubKey: BaseECKey) {
        this._data.setSignerPublicKey(signerPubKey);
        return this;
    }

    /**
     * Exports transaction to a compact object with unnamed members,
     * ready to be encoded with msgpack
     * and sent over the network
     * @returns - compact unnamed object
     */
    toUnnamedObject(): Promise<IBaseTxUnnamedObject> {
        return new Promise((resolve, reject) => {
            this.data.toUnnamedObject()
                .then((unnamedData: ICommonParentTxDataUnnamedObject) => {
                    const resultObj: IBaseTxUnnamedObject = [
                        this.data.typeTag,
                        unnamedData,
                    ];
                    if (this._signature.length > 0) {
                        resultObj[2] = this._signature;
                    }
                    return resolve(resultObj);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    toUnnamedObjectNoTag(): Promise<IBaseTxUnnamedObjectNoTag> {
        return new Promise((resolve, reject) => {
            this.toUnnamedObject()
                .then((unnamedObj: IBaseTxUnnamedObject) => {
                    const resultObj: IBaseTxUnnamedObjectNoTag = [
                        unnamedObj[1],
                    ];
                    if (unnamedObj[2]) {
                        resultObj[1] = unnamedObj[2];
                    }
                    return resolve(resultObj);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /**
     * Exports transaction to an object with named members and binary
     * values represented by Uint8Arrays
     * @returns - object with named members and binary values represented by Uint8Arrays
     */
    toObject(): Promise<IBaseTxObject> {
        return new Promise((resolve, reject) => {
            this._data.toObject()
                .then((dataObj: ICommonParentTxDataObject) => {
                    const resultObj: IBaseTxObject = {
                        type: this._data.typeTag,
                        data: dataObj,
                    };
                    if (this._signature.length > 0) {
                        resultObj.signature = this.signature;
                    }
                    return resolve(resultObj);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /**
     * Imports transaction from a compact object with unnamed members
     * @returns - compact unnamed object
     */
    fromUnnamedObject(passedObj: IBaseTxUnnamedObject): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (!this._schemaClassMap.has(passedObj[1][0])) {
                return reject(new Error(Errors.INVALID_SCHEMA));
            }
            this._data = this._schemaClassMap.get(passedObj[1][0])!();
            this._data.fromUnnamedObject(passedObj[1])
                .then((result: boolean) => {
                    this._typeTag = this._data.typeTag;
                    if (result && passedObj[2]) {
                        this._signature = passedObj[2];
                    }
                    return resolve(result);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    fromUnnamedObjectNoTag(passedObj: IBaseTxUnnamedObjectNoTag): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const unnamedArg: IBaseTxUnnamedObject = [
                '',
                passedObj[0],
            ];
            if (passedObj[1]) {
                unnamedArg[2] = passedObj[1];
            }
            this.fromUnnamedObject(unnamedArg)
                .then((result) => {
                    return resolve(result);
                })
                .catch((error: any) => {
                    return reject(error);
                });
            return resolve(true);
        });
    }

    /**
     * Imports transaction from an object with named members and binary
     * values represented by Uint8Arrays
     * @param passedObj - object with named members and binary values represented by Uint8Arrays
     */
    fromObject(passedObj: IBaseTxObject): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (!this._schemaClassMap.has(passedObj.data.schema)) {
                return reject(new Error(Errors.INVALID_SCHEMA));
            }
            this._data = this._schemaClassMap.get(passedObj.data.schema)!();
            this._data.fromObject(passedObj.data)
                .then((result: boolean) => {
                    this._typeTag = this._data.typeTag;
                    if (result && passedObj.signature) {
                        this._signature = passedObj.signature;
                    }
                    return resolve(result);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /** Signs transaction with private key, provided by
     * the gived key pair. This also automativcally sets
     * signerPublicKey of this transaction
     */
    sign(privateKey: BaseECKey): Promise<boolean> {
        return new Promise((resolve, reject) => {
            privateKey.extractPublic()
                .then((publicKey: BaseECKey) => {
                    this._data.signerPublicKey = publicKey;
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

    /** Verifies if transaction has a valid signature produced
     * by the private key associated with signerPublicKey
     */
    verify(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            super.verifySignature(this._data.signerPublicKey)
                .then((result: boolean) => {
                    return resolve(result);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /**
     * Computes the transaction ticket which would be returned by blockchain
     * itself on transaction submission.
     * @returns - ticket string
     */
    getTicket(): Promise<string> {
        return new Promise((resolve, reject) => {
            this._data.getTicket()
                .then((ticket: string) => {
                    return resolve(ticket);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }
}
