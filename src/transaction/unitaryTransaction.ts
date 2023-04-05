import * as Errors from '../errors';
import { TKeyGenAlgorithmValidHashValues } from '../cryptography/baseTypes';
import {
    DEF_SIGN_HASH_ALGORITHM as defaultSignHash,
} from '../cryptography/cryptoDefaults';
import {
    BaseTxData,
    IBaseTxDataUnnamedObject,
    IBaseTxDataObject,
} from './baseTxData';
import {
    BaseTransaction,
    IBaseTxUnnamedObject,
    IBaseTxObject,
} from './baseTransaction';

export interface IUnitaryTxUnnamedObject extends IBaseTxUnnamedObject {
    [1]: IBaseTxDataUnnamedObject;
    [2]: Uint8Array;
}

export interface IUnitaryTxObject extends IBaseTxObject {
    data: IBaseTxDataObject;
    signature: Uint8Array;
}

export class UnitaryTransaction extends BaseTransaction {
    protected _data: BaseTxData;

    constructor(
        hash: TKeyGenAlgorithmValidHashValues = defaultSignHash,
    ) {
        super(BaseTxData.defaultSchema, hash);
        this._data = new BaseTxData();
        this.typeTag = this.data.typeTag;
    }

    // eslint-disable-next-line class-methods-use-this
    get dependsOn() {
        throw new Error(Errors.ONLY_NODE_FIELD);
    }

    /** Hash of the bulk root transaction on which this one depends. */
    // eslint-disable-next-line class-methods-use-this
    set dependsOn(hash: Uint8Array) {
        throw new Error(Errors.ONLY_NODE_FIELD);
    }

    toUnnamedObject(): Promise<IUnitaryTxUnnamedObject> {
        return new Promise((resolve, reject) => {
            this._data.toUnnamedObject()
                .then((unnamedData: IBaseTxDataUnnamedObject) => {
                    const resultObj: IUnitaryTxUnnamedObject = [
                        this.typeTag,
                        unnamedData,
                        this.signature,
                    ];
                    return resolve(resultObj);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    toObject(): Promise<IUnitaryTxObject> {
        return new Promise((resolve, reject) => {
            this._data.toObject()
                .then((dataObj: IBaseTxDataObject) => {
                    const resultObj: IUnitaryTxObject = {
                        type: this._typeTag,
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

    fromUnnamedObject(passedObj: IUnitaryTxUnnamedObject): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (passedObj[1][0] !== BaseTxData.defaultSchema) {
                return reject(new Error(Errors.INVALID_SCHEMA));
            }
            this._data.fromUnnamedObject(passedObj[1])
                .then((result: boolean) => {
                    if (result) {
                        this._typeTag = passedObj[0];
                        this._signature = passedObj[2];
                    }
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
    fromObject(passedObj: IUnitaryTxObject): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this._data.fromObject(passedObj.data)
                .then((result: boolean) => {
                    if (result) {
                        this._typeTag = passedObj.type;
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
