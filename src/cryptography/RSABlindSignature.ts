import { modInv, modPow } from '../bigIntModArith';
import { b64UrlDecode, hexDecode, hexEncode } from '../binConversions';
import { IJwk } from './baseTypes';
import { RSAOAEP384KeyPairParams as defaultRSAParams } from './cryptoDefaults';
import { RSAKey } from './RSAKey';
import { RSAKeyPair } from './RSAKeyPair';

export function test(): void {
}

export interface IKeyComponents {
    mod: Uint8Array, // modulo
    exp: Uint8Array, // private or public exponent (depends on key type)
}

type TOpMode = 'enc' | 'dec';

/**
 * Returns rsa key components (exponent and module) as Uint8Arrays
 * @param inKey - rsa key
 * @returns - object with modulo and exponent
 */
export function getRSAKeyComponents(inKey: RSAKey): Promise<IKeyComponents> {
    return new Promise((resolve, reject) => {
        inKey.getJWK()
            .then((inKeyJWK) => {
                const resultObj: IKeyComponents = {
                    exp: b64UrlDecode(
                        inKey.type === 'private'
                            ? inKeyJWK.d!
                            : inKeyJWK.e!,
                    ),
                    mod: b64UrlDecode(
                        inKeyJWK.n!,
                    ),
                };
                return resolve(resultObj);
            })
            .catch((error: any) => {
                return reject(error);
            });
    });
}

interface IKeyComponentsBigInt {
    mod: bigint, // modulo
    exp: bigint, // private or public exponent (depends on key type)
}

function getRSAKeyComponentsBigInt(inKey: RSAKey): Promise<IKeyComponentsBigInt> {
    return new Promise((resolve, reject) => {
        getRSAKeyComponents(inKey)
            .then((keyComponents: IKeyComponents) => {
                const result: IKeyComponentsBigInt = {
                    mod: BigInt(`0x${hexEncode(keyComponents.mod)}`),
                    exp: BigInt(`0x${hexEncode(keyComponents.exp)}`),
                };
                return resolve(result);
            })
            .catch((error: any) => {
                return reject(error);
            });
    });
}

/**
 * Generates blinding factor based on a given public rsa key.
 * You will need this to remove blinding from signed data.
 * @param inKey - Signer's public rsa key
 * @returns - Blinding factor
 */
export function getFactor(inKey: RSAKey): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
        const generationParams = defaultRSAParams;
        generationParams
            .publicKey
            .genAlgorithm!
            .modulusLength! = inKey.keyParams.genAlgorithm!.modulusLength!;
        generationParams
            .privateKey
            .genAlgorithm!
            .modulusLength! = inKey.keyParams.genAlgorithm!.modulusLength!;
        const tempRsaKeyPair = new RSAKeyPair(generationParams);
        tempRsaKeyPair.generate()
            .then(() => {
                tempRsaKeyPair.privateKey.getJWK()
                    .then((tempPrivKeyJWK: IJwk) => {
                        const blindingFactor = b64UrlDecode(
                            tempPrivKeyJWK.p!,
                        );
                        return resolve(blindingFactor);
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
 * Apply blinding to data before submitting to signer
 * @param inData - data to hide from signer
 * @param blindingFactor - Slinding factor
 * @param inKey - Signer's rsa public key
 * @returns
 */
export function applyBlinding(
    inData: Uint8Array,
    blindingFactor: Uint8Array,
    inKey: RSAKey,
): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
        getRSAKeyComponentsBigInt(inKey)
            .then((inKeyComponents) => {
                const data: bigint = BigInt(`0x${hexEncode(inData)}`);
                const inKeyLength: number = inKey.keyParams.genAlgorithm!.modulusLength!;
                const inKeyExponent: bigint = inKeyComponents.exp;
                const inKeyModulo: bigint = inKeyComponents.mod;
                const factor: bigint = BigInt(`0x${hexEncode(blindingFactor)}`);
                const factorModPow: bigint = modPow(factor, inKeyExponent, inKeyModulo);
                const result: bigint = (data * factorModPow) % inKeyModulo;
                return resolve(hexDecode(result.toString(16).padStart(Math.floor(inKeyLength / 4), '0')));
            })
            .catch((error: any) => {
                return reject(error);
            });
    });
}

/**
 * Removes blinding from signature, making it a valid signature for original unblinded data.
 * @param inData - blind signature
 * @param blindingFactor - blinding factor, used during data blinding
 * @param inKey - signer's public key
 * @returns - original unblinded data valid signature.
 */
export function removeBlinding(
    inData: Uint8Array,
    blindingFactor: Uint8Array,
    inKey: RSAKey,
): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
        getRSAKeyComponentsBigInt(inKey)
            .then((inKeyComponents) => {
                const data = BigInt(`0x${hexEncode(inData)}`);
                const inKeyLength: number = inKey.keyParams.genAlgorithm!.modulusLength!;
                const inKeyModulo: bigint = inKeyComponents.mod;
                const factor: bigint = BigInt(`0x${hexEncode(blindingFactor)}`);
                const factorModInv: bigint = modInv(factor, inKeyModulo);
                const result = (data * factorModInv) % inKeyModulo;
                return resolve(hexDecode(result.toString(16).padStart(Math.floor(inKeyLength / 4), '0')));
            })
            .catch((error: any) => {
                return reject(error);
            });
    });
}

/**
 * Adds salt to blinded data
 * @param inData - blinded data
 * @param inSalt - salt value
 * @param inKey - signer's public rsa key
 * @returns - blinded salted data
 */
export function addSalt(
    inData: Uint8Array,
    inSalt: Uint8Array,
    inKey: RSAKey,
): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
        getRSAKeyComponentsBigInt(inKey)
            .then((key) => {
                const data: bigint = BigInt(`0x${hexEncode(inData)}`);
                const salt: bigint = BigInt(`0x${hexEncode(inSalt)}`);
                const modulo: bigint = key.mod;
                const KeyByteLength: number = inKey.keyParams.genAlgorithm!.modulusLength! / 8;
                const result = (data * salt) % modulo;
                return resolve(hexDecode(result.toString(16).padStart(KeyByteLength * 2, '0')));
            })
            .catch((error: any) => {
                return reject(error);
            });
    });
}

function transcryptDataBlock(
    dataBlock: Uint8Array,
    exponent: bigint,
    modulo: bigint,
    length: number,
): Uint8Array {
    return hexDecode(modPow(BigInt(`0x${hexEncode(dataBlock)}`), exponent, modulo).toString(16).padStart(length * 2, '0'));
}

function rsaTranscrypt(
    inData: Uint8Array,
    key: RSAKey,
    mode: TOpMode,
    outDataTotBytes?: number,
    customInDataBlockBytes?: number,
): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
        key.getJWK()
            .then((keyJWK) => {
                const inDataTotBytes = inData.byteLength;
                let inDataBlockBytes = key.keyParams.genAlgorithm!.modulusLength! / 8;
                let outDataBlockBytes = key.keyParams.genAlgorithm!.modulusLength! / 8;
                switch (mode) {
                    case 'enc':
                        inDataBlockBytes -= 1;
                        break;
                    case 'dec':
                        outDataBlockBytes -= 1;
                        break;
                    default:
                        throw new Error('Invalid mode.');
                }
                if (typeof customInDataBlockBytes !== 'undefined') {
                    inDataBlockBytes = customInDataBlockBytes!;
                }
                let nInBlocks = Math.floor(inDataTotBytes / inDataBlockBytes);
                nInBlocks = inDataTotBytes % inDataBlockBytes ? nInBlocks + 1 : nInBlocks;
                let outData = new Uint8Array([]);
                const keyExponent: bigint = BigInt(`0x${hexEncode(b64UrlDecode(key.type === 'private' ? keyJWK.d! : keyJWK.e!))}`);
                const keyModulo: bigint = BigInt(`0x${hexEncode(b64UrlDecode(keyJWK.n!))}`);
                for (let blockIndex = 0; blockIndex < nInBlocks; blockIndex += 1) {
                    const inBlock = (blockIndex === nInBlocks - 1)
                        ? inData.slice(inDataBlockBytes * blockIndex)
                        : inData.slice(
                            inDataBlockBytes * blockIndex,
                            inDataBlockBytes * (blockIndex + 1),
                        );
                    let outBlock = transcryptDataBlock(
                        inBlock,
                        keyExponent,
                        keyModulo,
                        outDataBlockBytes,
                    );
                    if (
                        typeof outDataTotBytes !== 'undefined'
                        && (blockIndex === nInBlocks - 1)
                    ) {
                        outBlock = outBlock.slice(
                            (
                                outDataBlockBytes
                                - (
                                    outDataTotBytes!
                                    % outDataBlockBytes
                                )
                            )
                            % outDataBlockBytes,
                        );
                    }
                    const _temp = new Uint8Array(outData.length + outBlock.length);
                    _temp.set(outData);
                    _temp.set(outBlock, outData.length);
                    outData = _temp;
                }
                return resolve(outData);
            })
            .catch((error: any) => {
                return reject(error);
            });
    });
}

export function encrypt(
    inData: Uint8Array,
    key:RSAKey,
    customInDataBlockSize?: number,
): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
        rsaTranscrypt(inData, key, 'enc', undefined, customInDataBlockSize)
            .then((outData) => {
                return resolve(outData);
            })
            .catch((error: any) => {
                return reject(error);
            });
    });
}

export function decrypt(
    inData: Uint8Array,
    key: RSAKey,
    outDataTotBytes?: number,
): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
        rsaTranscrypt(inData, key, 'dec', outDataTotBytes)
            .then((outData) => {
                return resolve(outData);
            })
            .catch((error: any) => {
                return reject(error);
            });
    });
}

/**
 * produces a signature from blinded data
 * @param inData - blinded data
 * @param key - signer's public rsa key
 * @returns - signature for provided blinded data
 */
export function blindSign(inData: Uint8Array, key: RSAKey) {
    const keyByteLength: number = key.keyParams.genAlgorithm!.modulusLength!;
    return encrypt(inData, key, keyByteLength);
}
