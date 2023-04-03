import * as Errors from '../errors';
import { TKeyGenAlgorithmValidHashValues } from '../cryptography/baseTypes';
import {
    DEF_SIGN_HASH_ALGORITHM as defaultSignHash,
} from '../cryptography/cryptoDefaults';
import {
    BulkNodeTxData,
    IBulkNodeTxDataUnnamedObject,
    IBulkNodeTxDataObject,
} from './bulkNodeTxData';
import {
    BaseTransaction,
    IBaseTxUnnamedObject,
    IBaseTxObject,
    IBaseTxUnnamedObjectNoTag,
} from './baseTransaction';

export interface IBulkNodeTxUnnamedObject extends IBaseTxUnnamedObject {
    [1]: IBulkNodeTxDataUnnamedObject;
    [2]: Uint8Array;
}

export interface IBulkNodeTxUnnamedObjectNoTag extends IBaseTxUnnamedObjectNoTag {
    [0]: IBulkNodeTxDataUnnamedObject,
    [1]: Uint8Array,
}

export interface IBulkNodeTxObject extends IBaseTxObject {
    data: IBulkNodeTxDataObject;
    signature: Uint8Array;
}

export class BulkNodeTransaction extends BaseTransaction {
    protected _data: BulkNodeTxData;

    constructor(
        hash: TKeyGenAlgorithmValidHashValues = defaultSignHash,
    ) {
        super(BulkNodeTxData.defaultSchema, hash);
        this._data = new BulkNodeTxData();
        this._typeTag = this._data.typeTag;
    }

    toUnnamedObject(): Promise<IBulkNodeTxUnnamedObject> {
        return new Promise((resolve, reject) => {
            this._data.toUnnamedObject()
                .then((unnamedData: IBulkNodeTxDataUnnamedObject) => {
                    const resultObj: IBulkNodeTxUnnamedObject = [
                        this._data.typeTag,
                        unnamedData,
                        this._signature,
                    ];
                    return resolve(resultObj);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    toUnnamedObjectNoTag(): Promise<IBulkNodeTxUnnamedObjectNoTag> {
        return new Promise((resolve, reject) => {
            this.toUnnamedObject()
                .then((unnamedObj: IBulkNodeTxUnnamedObject) => {
                    const resultObj: IBulkNodeTxUnnamedObjectNoTag = [
                        unnamedObj[1],
                        unnamedObj[2],
                    ];
                    return resolve(resultObj);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    toObject(): Promise<IBulkNodeTxObject> {
        return new Promise((resolve, reject) => {
            this._data.toObject()
                .then((dataObj: IBulkNodeTxDataObject) => {
                    const resultObj: IBulkNodeTxObject = {
                        type: this._data.typeTag,
                        data: dataObj,
                        signature: this.signature,
                    };
                    return resolve(resultObj);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    fromUnnamedObject(passedObj: IBulkNodeTxUnnamedObject): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (passedObj[1][0] !== BulkNodeTxData.defaultSchema) {
                return reject(new Error(Errors.INVALID_SCHEMA));
            }
            this._data.fromUnnamedObject(passedObj[1])
                .then((result: boolean) => {
                    if (result) {
                        this._typeTag = this._data.typeTag;
                        this._signature = passedObj[2];
                    }
                    return resolve(result);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    fromUnnamedObjectNoTag(passedObj: IBulkNodeTxUnnamedObjectNoTag): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const unnamedArg: IBulkNodeTxUnnamedObject = [
                '',
                passedObj[0],
                passedObj[1],
            ];
            this.fromUnnamedObject(unnamedArg)
                .then((result) => {
                    return resolve(result);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /**
     * Imports transaction from an object with named members and binary
     * values represented by Uint8Arrays
     * @param passedObj - object with named members and binary values represented by Uint8Arrays
     */
    fromObject(passedObj: IBulkNodeTxObject): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this._data.fromObject(passedObj.data)
                .then((result: boolean) => {
                    if (result) {
                        this._typeTag = this._data.typeTag;
                        this._signature = passedObj.signature;
                    }
                    return resolve(result);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }
}
