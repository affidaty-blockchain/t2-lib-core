import * as Errors from '../errors';
// import { BaseECKey } from '../cryptography/baseECKey';
import {
    TxSchemas,
    CommonParentTxData,
    ICommonParentTxDataUnnamedObject,
    ICommonParentTxDataObject,
} from './commonParentTxData';
import {
    BulkRootTransaction,
    IBulkRootTxObject,
    IBulkRootTxUnnamedObjectNoTag,
} from './bulkRootTransaction';
import {
    BulkNodeTransaction,
    IBulkNodeTxObject,
    IBulkNodeTxUnnamedObjectNoTag,
} from './bulkNodeTransaction';

const DEFAULT_SCHEMA = TxSchemas.BULK_TX;

interface ITxListUnnamedObject extends Array<any> {
    [0]: IBulkRootTxUnnamedObjectNoTag;
    [1]: IBulkNodeTxUnnamedObjectNoTag[] | null;
}

export interface IBulkTxDataUnnamedObject extends ICommonParentTxDataUnnamedObject {
    [1]: ITxListUnnamedObject;
}

interface ITxListObject extends Array<any> {
    [0]: IBulkRootTxObject;
    [1]: IBulkNodeTxObject[] | null;
}

export interface IBulkTxDataObject extends ICommonParentTxDataObject {
    txs: ITxListObject;
}

export class BulkTxData extends CommonParentTxData {
    protected _root: BulkRootTransaction;

    protected _nodes: Array<BulkNodeTransaction>;

    static get defaultSchema(): string {
        return DEFAULT_SCHEMA;
    }

    constructor(schema: string = DEFAULT_SCHEMA) {
        super(schema);
        this._root = new BulkRootTransaction();
        this._nodes = [];
    }

    get root(): BulkRootTransaction {
        return this._root;
    }

    set root(root: BulkRootTransaction) {
        this._root = root;
    }

    setRoot(root: BulkRootTransaction) {
        this.root = root;
        return this;
    }

    get nodes(): Array<BulkNodeTransaction> {
        return this._nodes;
    }

    set nodes(nodes: Array<BulkNodeTransaction>) {
        this._nodes = nodes;
    }

    addNode(node: BulkNodeTransaction) {
        this.nodes.push(node);
    }

    toUnnamedObject(): Promise<IBulkTxDataUnnamedObject> {
        return new Promise((resolve, reject) => {
            this._root.toUnnamedObjectNoTag()
                .then((serializedRoot: IBulkRootTxUnnamedObjectNoTag) => {
                    const nodesPromises: Array<Promise<IBulkNodeTxUnnamedObjectNoTag>> = [];
                    for (let i = 0; i < this._nodes.length; i += 1) {
                        nodesPromises.push(this._nodes[i].toUnnamedObjectNoTag());
                    }
                    Promise.allSettled(nodesPromises)
                        .then((nodesResults) => {
                            const txList: ITxListUnnamedObject = [
                                serializedRoot,
                                [],
                            ];
                            const resultObj: IBulkTxDataUnnamedObject = [
                                this.schema,
                                txList,
                            ];
                            if (nodesResults.length < 1) {
                                resultObj[1][1] = null;
                            }
                            for (let i = 0; i < nodesResults.length; i += 1) {
                                if (nodesResults[i].status === 'fulfilled') {
                                    resultObj[1][1]!.push(
                                        (
                                            nodesResults[i] as
                                            PromiseFulfilledResult<IBulkNodeTxUnnamedObjectNoTag>
                                        ).value,
                                    );
                                } else {
                                    return reject(
                                        new Error(
                                            `Could not export node transaction with index ${i}`,
                                        ),
                                    );
                                }
                            }
                            return resolve(resultObj);
                        })
                        .catch((error: any) => {
                            return reject(error);
                        });
                })
                .catch((error: any) => {
                    return reject(new Error(`could not export root: ${error}`));
                });
        });
    }

    toObject(): Promise<IBulkTxDataObject> {
        return new Promise((resolve, reject) => {
            this._root.toObject()
                .then((serializedRoot: IBulkRootTxObject) => {
                    const nodesPromises: Array<Promise<IBulkNodeTxObject>> = [];
                    for (let i = 0; i < this._nodes.length; i += 1) {
                        nodesPromises.push(this._nodes[i].toObject());
                    }
                    Promise.allSettled(nodesPromises)
                        .then((nodesResults) => {
                            const txList: ITxListObject = [
                                serializedRoot,
                                [],
                            ];
                            const resultObj: IBulkTxDataObject = {
                                schema: this.schema,
                                txs: txList,
                            };
                            if (nodesResults.length < 1) {
                                resultObj.txs[1] = null;
                            }
                            for (let i = 0; i < nodesResults.length; i += 1) {
                                if (nodesResults[i].status === 'fulfilled') {
                                    resultObj.txs[1]!.push(
                                        (
                                            nodesResults[i] as
                                            PromiseFulfilledResult<IBulkNodeTxObject>
                                        ).value,
                                    );
                                } else {
                                    return reject(
                                        new Error(
                                            `Could not export node transaction with index ${i}`,
                                        ),
                                    );
                                }
                            }
                            return resolve(resultObj);
                        })
                        .catch((error: any) => {
                            return reject(error);
                        });
                })
                .catch((error: any) => {
                    return reject(new Error(`Could not export root: ${error}`));
                });
        });
    }

    fromUnnamedObject(passedObj: IBulkTxDataUnnamedObject): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (passedObj[0] !== DEFAULT_SCHEMA) {
                return reject(new Error(Errors.INVALID_SCHEMA));
            }
            this._root = new BulkRootTransaction();
            this._nodes = [];
            this.schema = passedObj[0];
            this._root.fromUnnamedObjectNoTag(passedObj[1][0])
                .then((result) => {
                    if (result) {
                        const nodesPromises: Array<Promise<boolean>> = [];
                        if (passedObj[1][1]) {
                            for (let i = 0; i < passedObj[1][1].length; i += 1) {
                                const bulkNodeTx = new BulkNodeTransaction();
                                this._nodes.push(bulkNodeTx);
                                nodesPromises.push(
                                    this._nodes[i].fromUnnamedObjectNoTag(
                                        passedObj[1][1][i] as IBulkNodeTxUnnamedObjectNoTag,
                                    ),
                                );
                            }
                        }
                        Promise.allSettled(nodesPromises)
                            .then((nodesResults) => {
                                for (let i = 0; i < nodesResults.length; i += 1) {
                                    if (
                                        nodesResults[i].status === 'rejected'
                                        || !(
                                            nodesResults[i] as PromiseFulfilledResult<boolean>
                                        ).value
                                    ) {
                                        return reject(
                                            new Error(
                                                `Could not import transaction with index ${i + 1}`,
                                            ),
                                        );
                                    }
                                }
                                return resolve(true);
                            })
                            .catch((error: any) => {
                                return reject(error);
                            });
                    } else {
                        return reject(new Error('could not import root'));
                    }
                })
                .catch((error: any) => {
                    return reject(new Error(`could not import root: ${error}`));
                });
        });
    }

    fromObject(passedObj: IBulkTxDataObject): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (passedObj.schema !== DEFAULT_SCHEMA) {
                return reject(new Error(Errors.INVALID_SCHEMA));
            }
            this.schema = passedObj.schema;
            this._root.fromObject(passedObj.txs[0])
                .then((result) => {
                    if (result) {
                        this._nodes = [];
                        const nodesPromises: Array<Promise<boolean>> = [];
                        if (passedObj.txs[1]) {
                            for (let i = 0; i < passedObj.txs[1].length; i += 1) {
                                const bulkNodeTx = new BulkNodeTransaction();
                                this._nodes.push(bulkNodeTx);
                                nodesPromises.push(
                                    this._nodes[i].fromObject(
                                        passedObj.txs[1][i] as IBulkNodeTxObject,
                                    ),
                                );
                            }
                        }
                        Promise.allSettled(nodesPromises)
                            .then((nodesResults) => {
                                for (let i = 0; i < nodesResults.length; i += 1) {
                                    if (
                                        nodesResults[i].status === 'rejected'
                                        || !(
                                            nodesResults[i] as PromiseFulfilledResult<boolean>
                                        ).value
                                    ) {
                                        return reject(
                                            new Error(
                                                `Could not import transaction with index ${i + 1}`,
                                            ),
                                        );
                                    }
                                }
                                return resolve(true);
                            })
                            .catch((error: any) => {
                                return reject(error);
                            });
                    } else {
                        return reject(new Error('could not import root'));
                    }
                })
                .catch((error: any) => {
                    return reject(new Error(`could not import root: ${error}`));
                });
        });
    }
}
