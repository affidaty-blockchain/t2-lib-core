import * as Errors from '../errors';

import {
    TxSchemas,
    SCHEMA_TO_TYPE_TAG_MAP,
    ICommonParentTxDataUnnamedObject,
} from './commonParentTxData';
import {
    BaseTxData,
    IBaseTxDataUnnamedObject,
    IBaseTxDataObject,
    IBaseTxDataPublicKeyUnnamedObject,
} from './baseTxData';

const EMPTY_SCHEMA = TxSchemas.BULK_EMPTY_ROOT_TX;
const DEFAULT_SCHEMA = TxSchemas.BULK_ROOT_TX;

export interface TEmptyBulkRootTxDataUnnamedObject extends ICommonParentTxDataUnnamedObject {
    /** Max fuel that consumable by this transaction */
    [1]: number;
    /** Nonce */
    [2]: Uint8Array;
    /** Network name */
    [4]: string;
    /** Signer's public key */
    [5]: IBaseTxDataPublicKeyUnnamedObject;
}

export class BulkRootTxData extends BaseTxData {
    static get defaultSchema(): string {
        return DEFAULT_SCHEMA;
    }

    constructor(schema: string = DEFAULT_SCHEMA) {
        super(schema);
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

    isEmpty(): boolean {
        if ((!this.target || !this.target.length)
            && (!this.smartContractHash || !this.smartContractHash.length)
            && (!this.smartContractMethod || !this.smartContractMethod.length)
            && (!this.smartContractMethodArgsBytes || !this.smartContractMethodArgsBytes.length)
        ) {
            return true;
        }
        return false;
    }

    toUnnamedObject(): Promise<any> {
        return new Promise((resolve, reject) => {
            if (this.isEmpty() && this.schema !== EMPTY_SCHEMA) {
                this.schema = EMPTY_SCHEMA;
                this.typeTag = SCHEMA_TO_TYPE_TAG_MAP.get(EMPTY_SCHEMA)!;
            } else if (!this.isEmpty() && this.schema === EMPTY_SCHEMA) {
                this.schema = DEFAULT_SCHEMA;
                this.typeTag = SCHEMA_TO_TYPE_TAG_MAP.get(DEFAULT_SCHEMA)!;
            }
            super.toUnnamedObject()
                .then((superResult: IBaseTxDataUnnamedObject) => {
                    if (this.isEmpty()) {
                        return resolve([
                            superResult[0],
                            superResult[2],
                            superResult[3],
                            superResult[4],
                            superResult[7],
                        ]);
                    }
                    return resolve(superResult);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    toObject(): Promise<any> {
        return new Promise((resolve, reject) => {
            if (this.isEmpty() && this.schema !== EMPTY_SCHEMA) {
                this.schema = EMPTY_SCHEMA;
                this.typeTag = SCHEMA_TO_TYPE_TAG_MAP.get(EMPTY_SCHEMA)!;
            }
            this.toUnnamedObject()
                .then((unnamedObject: any) => {
                    if (this.isEmpty()) {
                        return resolve({
                            schema: unnamedObject[0],
                            maxFuel: unnamedObject[1],
                            nonce: unnamedObject[2],
                            network: unnamedObject[3],
                            caller: {
                                type: unnamedObject[4][0],
                                curve: unnamedObject[4][1],
                                value: unnamedObject[4][2],
                            },
                        });
                    }
                    return resolve({
                        schema: unnamedObject[0],
                        account: unnamedObject[1],
                        maxFuel: unnamedObject[2],
                        nonce: unnamedObject[3],
                        network: unnamedObject[4],
                        contract: unnamedObject[5],
                        method: unnamedObject[6],
                        caller: {
                            type: unnamedObject[7][0],
                            curve: unnamedObject[7][1],
                            value: unnamedObject[7][2],
                        },
                        args: unnamedObject[8],
                    });
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    fromUnnamedObject(passedObj: any): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const tempPassedObj: IBaseTxDataUnnamedObject = passedObj.length > 5
                ? passedObj
                : [
                    passedObj[0],
                    '',
                    passedObj[1],
                    passedObj[2],
                    passedObj[3],
                    null,
                    '',
                    passedObj[4],
                    new Uint8Array([]),
                ];
            super.fromUnnamedObject(tempPassedObj)
                .then((result) => {
                    return resolve(result);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    fromObject(passedObj: any): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const tempPassedObj: IBaseTxDataObject = Object.keys(passedObj).length > 5
                ? passedObj
                : {
                    schema: passedObj.schema,
                    account: '',
                    maxFuel: passedObj.maxFuel,
                    nonce: passedObj.nonce,
                    network: passedObj.network,
                    contract: null,
                    method: '',
                    caller: passedObj.caller,
                    args: new Uint8Array([]),
                };
            super.fromObject(tempPassedObj)
                .then((result) => {
                    return resolve(result);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }
}
