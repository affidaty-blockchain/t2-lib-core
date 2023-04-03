import * as Errors from '../errors';
import {
    EKeyParamsIds,
    mKeyPairParams,
} from '../cryptography/cryptoDefaults';
import { BaseECKey } from '../cryptography/baseECKey';
import {
    TxSchemas,
    CommonParentTxData,
    ICommonParentTxDataUnnamedObject,
    ICommonParentTxDataObject,
    SCHEMA_TO_TYPE_TAG_MAP,
} from './commonParentTxData';

const DEFAULT_SCHEMA = TxSchemas.UNITARY_TX;

export interface IBaseTxDataPublicKeyUnnamedObject extends Array<any> {
    /** Public key algorithm type. E.g. "ecdsa". */
    [0]: string;
    /** Public key curve type. E.g. 'secp384r1' */
    [1]: string;
    /** Actual value of the public key as "raw" bytes */
    [2]: Uint8Array;
}

export interface IBaseTxDataUnnamedObject extends ICommonParentTxDataUnnamedObject {
    /** Target AccountId */
    [1]: string;
    /** Max fuel that consumable by this transaction */
    [2]: bigint;
    /** Nonce */
    [3]: Uint8Array;
    /** Network name */
    [4]: string;
    /** Smart contract hash */
    [5]: Uint8Array | null;
    /** Smart contract method */
    [6]: string;
    /** Signer's public key */
    [7]: IBaseTxDataPublicKeyUnnamedObject;
    /** Bytes representing smart contract arguments */
    [8]: Uint8Array;
}

interface IBaseTxDataPublicKeyObject {
    /** Public key algorithm type. E.g. "ecdsa". */
    type: string;
    /** Public key curve type. E.g. 'secp384r1' */
    curve: string;
    /** Actual value of the public key as "raw" bytes */
    value: Uint8Array;
}

/** Structure returned by toObject() method. */
export interface IBaseTxDataObject extends ICommonParentTxDataObject {
    /** Target AccountId */
    account: string;
    /** Max fuel that consumable by this transaction */
    maxFuel: bigint;
    /** Nonce */
    nonce: Uint8Array;
    /** Network name */
    network: string;
    /** Smart contract hash */
    contract: Uint8Array | null;
    /** Smart contract method */
    method: string;
    /** Signer's public key */
    caller: IBaseTxDataPublicKeyObject;
    /** Bytes representing smart contract arguments */
    args: Uint8Array;
}

export class BaseTxData extends CommonParentTxData {
    static get defaultSchema(): string {
        return DEFAULT_SCHEMA;
    }

    constructor(schema: string = DEFAULT_SCHEMA) {
        super(schema);
    }

    toUnnamedObject(): Promise<IBaseTxDataUnnamedObject> {
        return new Promise((resolve, reject) => {
            const resultObj: IBaseTxDataUnnamedObject = [
                this.schema,
                this.target,
                this.maxFuel,
                this.nonce,
                this.networkName,
                this.smartContractHash.length ? this.smartContractHash : null,
                this.smartContractMethod,
                [
                    '',
                    '',
                    new Uint8Array([]),
                ],
                this.smartContractMethodArgsBytes,
            ];
            if (this.signerPublicKey.paramsId === EKeyParamsIds.EMPTY) {
                return resolve(resultObj);
            }
            this.signerPublicKey.getRaw()
                .then((rawKeyBytes: Uint8Array) => {
                    const underscoreIndex = this.signerPublicKey.paramsId.indexOf('_');
                    if (underscoreIndex > -1) {
                        resultObj[7][0] = this.signerPublicKey.paramsId.slice(0, underscoreIndex);
                        resultObj[7][1] = this.signerPublicKey.paramsId.slice(underscoreIndex + 1);
                    } else {
                        resultObj[7][0] = this.signerPublicKey.paramsId;
                    }
                    resultObj[7][2] = rawKeyBytes;
                    return resolve(resultObj);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    toObject(): Promise<IBaseTxDataObject> {
        return new Promise((resolve, reject) => {
            this.toUnnamedObject()
                .then((unnamedObject: IBaseTxDataUnnamedObject) => {
                    const resultObj: IBaseTxDataObject = {
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
                    };
                    return resolve(resultObj);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    fromUnnamedObject(passedObj: IBaseTxDataUnnamedObject): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (!SCHEMA_TO_TYPE_TAG_MAP.has(passedObj[0])) {
                return reject(new Error(Errors.INVALID_SCHEMA));
            }
            this.typeTag = SCHEMA_TO_TYPE_TAG_MAP.get(passedObj[0])!;
            this.schema = passedObj[0];
            this.target = passedObj[1];
            this.maxFuel = passedObj[2];
            this.nonce = passedObj[3];
            this.networkName = passedObj[4];
            this.smartContractHash = passedObj[5];
            this.smartContractMethod = passedObj[6];
            let keyParamsId: string = passedObj[7][0];
            if (passedObj[7][1].length > 0) {
                keyParamsId += `_${passedObj[7][1]}`;
            }
            if (!mKeyPairParams.has(keyParamsId)) {
                return reject(new Error(Errors.IMPORT_TYPE_ERROR));
            }
            this.signerPublicKey = new BaseECKey(
                mKeyPairParams.get(keyParamsId)!.publicKey,
            );
            this.smartContractMethodArgsBytes = passedObj[8];
            if (keyParamsId === EKeyParamsIds.EMPTY) {
                return resolve(true);
            }
            this.signerPublicKey.importBin(new Uint8Array(passedObj[7][2]))
                .then((result) => {
                    return resolve(result);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    fromObject(passedObj: IBaseTxDataObject): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const unnamedObject: IBaseTxDataUnnamedObject = [
                passedObj.schema,
                passedObj.account,
                passedObj.maxFuel,
                passedObj.nonce,
                passedObj.network,
                passedObj.contract,
                passedObj.method,
                [
                    passedObj.caller.type,
                    passedObj.caller.curve,
                    passedObj.caller.value,
                ],
                passedObj.args,
            ];
            this.fromUnnamedObject(unnamedObject)
                .then((result: boolean) => {
                    return resolve(result);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }
}
