import {
    TxSchemas,
} from './commonParentTxData';
import {
    BaseTxData,
    IBaseTxDataUnnamedObject,
    IBaseTxDataObject,
} from './baseTxData';

const DEFAULT_SCHEMA = TxSchemas.BULK_NODE_TX;

export interface IBulkNodeTxDataUnnamedObject extends IBaseTxDataUnnamedObject {
    /** Hash of the bulk root transaction on which this one depends. */
    [9]: Uint8Array;
}

export interface IBulkNodeTxDataObject extends IBaseTxDataObject {
    /** Hash of the bulk root transaction on which this one depends. */
    dependsOn: Uint8Array;
}

export class BulkNodeTxData extends BaseTxData {
    static get defaultSchema(): string {
        return DEFAULT_SCHEMA;
    }

    constructor(schema: string = DEFAULT_SCHEMA) {
        super(schema);
    }

    toUnnamedObject(): Promise<IBulkNodeTxDataUnnamedObject> {
        return new Promise((resolve, reject) => {
            super.toUnnamedObject()
                .then((superResult: IBaseTxDataUnnamedObject) => {
                    const resultObj: IBulkNodeTxDataUnnamedObject = [
                        superResult[0],
                        superResult[1],
                        superResult[2],
                        superResult[3],
                        superResult[4],
                        superResult[5],
                        superResult[6],
                        superResult[7],
                        superResult[8],
                        this.dependsOn,
                    ];
                    return resolve(resultObj);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    toObject(): Promise<IBulkNodeTxDataObject> {
        return new Promise((resolve, reject) => {
            super.toObject()
                .then((superResult: IBaseTxDataObject) => {
                    const resultObj: IBulkNodeTxDataObject = {
                        ...superResult,
                        dependsOn: new Uint8Array(this.dependsOn),
                    };
                    return resolve(resultObj);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    fromUnnamedObject(passedObj: IBulkNodeTxDataUnnamedObject): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (passedObj[9]) {
                this.dependsOn = passedObj[9];
            }
            super.fromUnnamedObject(passedObj)
                .then((result) => {
                    return resolve(result);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    fromObject(passedObj: IBulkNodeTxDataObject): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (passedObj.dependsOn) {
                this.dependsOn = passedObj.dependsOn;
            }
            super.fromObject(passedObj)
                .then((result) => {
                    return resolve(result);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }
}
