import * as Errors from '../errors';
import { TKeyGenAlgorithmValidHashValues } from '../cryptography/baseTypes';
import {
    DEF_SIGN_HASH_ALGORITHM as defaultSignHash,
} from '../cryptography/cryptoDefaults';
import { TxSchemas } from './commonParentTxData';
import {
    BaseTransaction,
    IBaseTxUnnamedObject,
    IBaseTxObject,
} from './baseTransaction';
import { BulkRootTransaction } from './bulkRootTransaction';
import { BulkNodeTransaction } from './bulkNodeTransaction';
import {
    BulkTxData,
    IBulkTxDataUnnamedObject,
    IBulkTxDataObject,
} from './bulkTxData';

const DEFAULT_SCHEMA = TxSchemas.BULK_TX;

export interface IBulkTxUnnamedObject extends IBaseTxUnnamedObject {
    [1]: IBulkTxDataUnnamedObject;
    [2]: Uint8Array;
}

export interface IBulkTxObject extends IBaseTxObject {
    data: IBulkTxDataObject;
    signature: Uint8Array;
}

export class BulkTransaction extends BaseTransaction {
    protected _data: BulkTxData;

    constructor(
        hash: TKeyGenAlgorithmValidHashValues = defaultSignHash,
    ) {
        super(BulkTxData.defaultSchema, hash);
        this._data = new BulkTxData(DEFAULT_SCHEMA);
        this._typeTag = this._data.typeTag;
    }

    get data(): BulkTxData {
        return this._data;
    }

    set data(data: BulkTxData) {
        this._data = data;
    }

    get root(): BulkRootTransaction {
        return this.data.root;
    }

    set root(rootTx: BulkRootTransaction) {
        this.data.root = rootTx;
    }

    setRoot(rootTx: BulkRootTransaction) {
        this.data.setRoot(rootTx);
        return this;
    }

    get nodes() {
        return this.data.nodes;
    }

    set nodes(nodes: BulkNodeTransaction[]) {
        this.data.nodes = nodes;
    }

    addNode(nodeTx: BulkNodeTransaction) {
        this.data.addNode(nodeTx);
        return this;
    }

    toUnnamedObject(): Promise<IBulkTxUnnamedObject> {
        return new Promise((resolve, reject) => {
            this.data.toUnnamedObject()
                .then((unnamedData: IBulkTxDataUnnamedObject) => {
                    const resultObj: IBulkTxUnnamedObject = [
                        this.data.typeTag,
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

    toObject(): Promise<IBulkTxObject> {
        return new Promise((resolve, reject) => {
            this.data.toObject()
                .then((dataObj: IBulkTxDataObject) => {
                    const resultObj: IBulkTxObject = {
                        type: this.data.typeTag,
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

    fromUnnamedObject(passedObj: IBulkTxUnnamedObject): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (passedObj[1][0] !== DEFAULT_SCHEMA) {
                return reject(new Error(Errors.INVALID_SCHEMA));
            }
            this.data.fromUnnamedObject(passedObj[1])
                .then((result: boolean) => {
                    if (result) {
                        this.typeTag = this._data.typeTag;
                        this.signature = passedObj[2];
                    }
                    return resolve(result);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    fromObject(passedObj: IBulkTxObject): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.data.fromObject(passedObj.data)
                .then((result: boolean) => {
                    if (result) {
                        this.typeTag = this._data.typeTag;
                        this.signature = passedObj.signature;
                    }
                    return resolve(result);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    verify(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this._data.root.getTicket()
                .then((rootTicket: string) => {
                    const nodesVerifyPromises: Array<Promise<boolean>> = [];
                    for (let i = 0; i < this._data.nodes.length; i += 1) {
                        if (this._data.nodes[i].data.dependsOnHex !== rootTicket) {
                            return reject(new Error(`Node transaction with index ${i} not dependant on root.`));
                        }
                        if (this._data.nodes[i].data.networkName
                            !== this._data.root.data.networkName
                        ) {
                            return reject(new Error(`Node transaction with index ${i} was created for a different network than root.`));
                        }
                        nodesVerifyPromises.push(this._data.nodes[i].verify());
                    }
                    Promise.allSettled(nodesVerifyPromises)
                        .then((results) => {
                            for (let i = 0; i < results.length; i += 1) {
                                if (results[i].status === 'rejected'
                                    || !(results[i] as PromiseFulfilledResult<boolean>).value
                                ) {
                                    return reject(new Error(`Node transaction with index ${i} could not be verified.`));
                                }
                            }
                            this.verifySignature(this._data.root.data.signerPublicKey)
                                .then((result) => {
                                    return resolve(result);
                                })
                                .catch((error: any) => {
                                    return reject(error);
                                });
                        });
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }
}
