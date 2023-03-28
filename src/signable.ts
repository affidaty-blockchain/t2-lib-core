import { b58Encode, b58Decode } from './binConversions';
import { objectToBytes, bytesToObject } from './utils';
import { TKeyGenAlgorithmValidHashValues } from './cryptography/baseTypes';
import { signData, verifyDataSignature } from './cryptography/base';
import { DEF_SIGN_HASH_ALGORITHM as defaultSignHash } from './cryptography/cryptoDefaults';
import { BaseECKey } from './cryptography/baseECKey';

/**
 * Structure returned by Signable.toObject() method.
 */
export interface ISignableObject {
    type: string;
    data: any;
    signature?: Uint8Array;
}

export interface ISignableObjectNoTag {
    data: any;
    signature?: Uint8Array;
}

export interface ISignableUnnamedObject extends Array<any> {
    [0]: string;
    [1]: any,
    [2]?: Uint8Array;
}

export interface ISignableUnnamedObjectNoTag extends Array<any> {
    [0]: any,
    [1]?: Uint8Array;
}

/**
 * Class for automatic transaction creation, management and transcoding
 */
export class Signable {
    protected _typeTag: string = '';

    protected _data: any = {};

    protected _signature: Uint8Array = new Uint8Array([]);

    protected _signHashAlg: TKeyGenAlgorithmValidHashValues;

    constructor(hash: TKeyGenAlgorithmValidHashValues = defaultSignHash) {
        this._signHashAlg = hash;
    }

    public get typeTag(): string {
        return this._typeTag;
    }

    public set typeTag(typeTag: string) {
        this._typeTag = typeTag;
    }

    setTypeTag(typeTag: string) {
        this.typeTag = typeTag;
        return this;
    }

    /** Data to sign */
    public get data(): any {
        return this._data;
    }

    /** Data to sign */
    public set data(newData: any) {
        this._data = newData;
    }

    /** Data to sign */
    setData(newData: any) {
        this.data = newData;
        return this;
    }

    /** Data signature */
    public get signature(): Uint8Array {
        return new Uint8Array(this._signature);
    }

    /** Data signature */
    public set signature(signature: Uint8Array) {
        this._signature = signature;
    }

    /** Data signature */
    setSignature(signature: Uint8Array) {
        this.signature = signature;
        return this;
    }

    protected toUnnamedObject(): Promise<ISignableUnnamedObject> {
        return new Promise((resolve) => {
            const resultObj: ISignableUnnamedObject = [
                this._typeTag,
                this._data,
            ];
            if (this._signature.byteLength > 0) {
                resultObj[2] = this._signature;
            }
            return resolve(resultObj);
        });
    }

    protected toUnnamedObjectNoTag(): Promise<ISignableUnnamedObjectNoTag> {
        return new Promise((resolve, reject) => {
            this.toUnnamedObject()
                .then((unnamedObj: ISignableUnnamedObject) => {
                    const resultObj: ISignableUnnamedObjectNoTag = [
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
     * Serializes signable to a simple object with named properties
     * @returns - object, throws otherwise
     */
    public toObject(): Promise<ISignableObject> {
        return new Promise((resolve, reject) => {
            this.toUnnamedObject()
                .then((unnamedObj: ISignableUnnamedObject) => {
                    const resultObj: ISignableObject = {
                        type: unnamedObj[0],
                        data: unnamedObj[1],
                    };
                    if (unnamedObj[2]) {
                        resultObj.signature = unnamedObj[2];
                    }
                    return resolve(resultObj);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /**
     * Serializes signable object to a Uint8Array
     * @returns - Uint8Array, throws otherwise
     */
    public toBytes(): Promise<Uint8Array> {
        return new Promise((resolve, reject) => {
            this.toUnnamedObject()
                .then((unnamedObj: ISignableUnnamedObject) => {
                    return resolve(objectToBytes(unnamedObj));
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /**
     * Serializes signable object to a base58 string
     * @returns - b58 string, throws otherwise
     */
    public toBase58(): Promise<string> {
        return new Promise((resolve, reject) => {
            this.toBytes()
                .then((bytes: Uint8Array) => {
                    return resolve(b58Encode(bytes));
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    protected fromUnnamedObject(passedObj: ISignableUnnamedObject): Promise<boolean> {
        return new Promise((resolve) => {
            this._typeTag = passedObj[0];
            this._data = passedObj[1];
            if (passedObj[2]) {
                this._signature = passedObj[2];
            }
            return resolve(true);
        });
    }

    protected fromUnnamedObjectNoTag(passedObj: ISignableUnnamedObjectNoTag): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const unnamedArg: ISignableUnnamedObject = [
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
     * Tries to deserialize a signable from object with named properties.
     * @param object - object to try to deserialize signable from
     * @returns - true on success, throws otherwise
     */
    public fromObject(passedObj: ISignableObject): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const unnamedArg: ISignableUnnamedObject = [
                passedObj.type,
                passedObj.data,
            ];
            if (passedObj.signature) {
                unnamedArg[2] = passedObj.signature;
            }
            this.fromUnnamedObject(unnamedArg)
                .then((result: boolean) => {
                    return resolve(result);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /**
     * Tries to deserialize a signable from a Uint8Array.
     * @param bytes - base58 string to try to deserialize signable from
     * @returns - true on success, throws otherwise
     */
    public fromBytes(bytes: Uint8Array): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const unnamedObj: ISignableUnnamedObject = bytesToObject(bytes);
            this.fromUnnamedObject(unnamedObj)
                .then((result) => {
                    return resolve(result);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /**
     * Tries to deserialize a signable from a base58 string.
     * @param b58 - base58 string to try to deserialize signable from
     * @returns - true on success, throws otherwise
     */
    public fromBase58(b58: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.fromBytes(b58Decode(b58))
                .then((result) => {
                    return resolve(result);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /**
     * Sign data with private key
     * @param privateKey - private key to sign data with
     * @returns - true if signed, throws otherwise
     */
    public sign(privateKey: BaseECKey): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.toUnnamedObject()
                .then((unnamedObject: ISignableUnnamedObject) => {
                    const bytesToSign: Uint8Array = objectToBytes(unnamedObject[1]);
                    signData(privateKey, bytesToSign, this._signHashAlg)
                        .then((signature: Uint8Array) => {
                            this._signature = signature;
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

    /**
     * Verifies data signature against a public key
     * @param publicKey - Public key to verify signature against
     * @returns - true if signature is valid, false otherwise. Can throw.
     */
    public verifySignature(publicKey: BaseECKey): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.toUnnamedObject()
                .then((unnamedObject: ISignableUnnamedObject) => {
                    const dataToVerify: Uint8Array = objectToBytes(unnamedObject[1]);
                    verifyDataSignature(
                        publicKey,
                        dataToVerify,
                        this._signature,
                        this._signHashAlg,
                    )
                        .then((result: boolean) => {
                            return resolve(result);
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
}
