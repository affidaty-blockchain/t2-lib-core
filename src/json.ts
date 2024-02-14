import * as Errors from './errors';

import { objectToBytes } from './utils';

import {
    regexDigits,
    regexHex,
    hexDecode,
    hexEncode,
    base58Decode,
    base58Encode,
    base64Decode,
    base64Encode,
    base64UrlDecode,
    base64UrlEncode,
} from './binConversions';

const MAX_U64 = BigInt('0xffffffffffffffff');

export const customValueProcessors: {[key: string]: {[key: string]: (value: string) => any}} = {
    bin: {
        utf8: (val: string) => {
            return new TextEncoder().encode(val);
        },
        hex: (val: string) => {
            return hexDecode(val);
        },
        b58: (val: string) => {
            return base58Decode(val);
        },
        b64: (val: string) => {
            return base64Decode(val);
        },
        b64url: (val: string) => {
            return base64UrlDecode(val);
        },
    },
    u64: {
        dec: (val: string) => {
            if (!val.match(regexDigits)) {
                throw new Error(Errors.NOT_DEC);
            }
            const result = BigInt(val);
            if (result < BigInt(0) || result > MAX_U64) {
                throw new Error('U64 value out of bounds.');
            }
            return result;
        },
        hex: (val: string) => {
            if (!val.match(regexHex)) {
                throw new Error(Errors.NOT_HEX);
            }
            const tempVal = val.length % 2 ? `0${val}` : val;
            if (tempVal.length > 16) {
                throw new Error('Hexadecimal strings for 64-bit numbers must be at most 16 chars long.');
            }
            return BigInt(`0x${tempVal}`);
        },
    },
};

export const customKeyProcessors: {[key: string]: (value: string) => any} = {
    msgpack: (val: any) => {
        return objectToBytes(val);
    },
};

function callValueProcessor(type: string, encoding: string, value: string): any {
    if (!customValueProcessors[type]) {
        throw new Error(`Known types: ${JSON.stringify(Object.keys(customValueProcessors))}. Received type: "${type}".`);
    }
    if (!customValueProcessors[type][encoding]) {
        throw new Error(`Known encodings for type "${type}": ${JSON.stringify(Object.keys(customValueProcessors[type]))}. Received encoding: "${encoding}".`);
    }

    return customValueProcessors[type][encoding](value);
}

function callKeyProcessor(processorName: string, value: any): any {
    if (!customKeyProcessors[processorName]) {
        throw new Error(`Known key processors: ${JSON.stringify(Object.keys(customKeyProcessors))}. Received type: "${processorName}".`);
    }
    return customKeyProcessors[processorName](value);
}

export function jsonParse(jsonStr: string): any {
    const delimiter = ':';
    // special strings must begin with this token
    const initToken = `$${delimiter}`; // "$:"
    return JSON.parse(
        jsonStr,
        (key, value) => {
            let resultValue: any = value;
            if (
                typeof value === 'string'
                && value.length > initToken.length
                && value.startsWith(initToken)
            ) {
                // type delimiter index
                const typeDelIdx = value.indexOf(delimiter, initToken.length);
                if (typeDelIdx <= initToken.length) {
                    throw new Error(`Could not determine special value type for key ${key}.`);
                }
                // encoding delimiter index
                const encDelIdx = value.indexOf(delimiter, typeDelIdx + 1);
                if (encDelIdx <= typeDelIdx + 1 || encDelIdx + 1 >= value.length) {
                    throw new Error(`Could not determine special value encoding for key ${key}.`);
                }
                const type = value.substring(initToken.length, typeDelIdx);
                const enc = value.substring(typeDelIdx + 1, encDelIdx);
                const val = value.substring(encDelIdx + 1);
                resultValue = callValueProcessor(type, enc, val);
            }
            if (
                typeof resultValue === 'object'
                && resultValue !== null
                && resultValue !== undefined
                && !Array.isArray(resultValue)
            ) {
                const resultKeys = Object.keys(resultValue);
                for (let i = 0; i < resultKeys.length; i += 1) {
                    const origKey = resultKeys[i];
                    if (origKey.startsWith(initToken)) {
                        const procDelIdx = origKey.indexOf(delimiter, initToken.length);
                        if (procDelIdx <= initToken.length) {
                            throw new Error(`Could not determine processor type for key ${origKey}.`);
                        }
                        const procName = origKey.substring(initToken.length, procDelIdx);
                        const newKey = origKey.substring(
                            initToken.length + procName.length + delimiter.length,
                        );
                        resultValue[newKey] = callKeyProcessor(procName, resultValue[origKey]);
                        delete resultValue[origKey];
                    }
                }
            }
            return resultValue;
        },
    );
}

interface IJSONStringifyOptions {
    /** Default: `hex`. Binary type (ArrayBufferView) encoding. Example result: `"$:bin:hex:ff00ff00cc"` */
    bin?: 'utf8' | 'hex' | 'b58' | 'b64' | 'b64url',
    /** Default: `dec`. BigInt type encoding. Values exceeding max U64 not allowed (use bin instead). Example result: `"$:u64:dec:164963846205223"`. */
    u64?: 'dec' | 'hex',
}

/**
 * Works just like regular JSON.stringify(), but values of binary or BigInt types will be encoded into strings parsable by our custom jsonParse function.
 * Thrown when BigInt value exceeds max U64 integer. Consider transforming it into binary first.
 * @param obj - Object to stringify
 * @param options - Stringifization options
 * @param space - Adds indentation, white space, and line break characters to the return-value JSON text to make it easier to read
 */
export function jsonStringify(
    obj: any,
    options?: IJSONStringifyOptions | null,
    space?: string | number,
): string {
    return JSON.stringify(
        obj,
        (key, value) => {
            let encodedValue = '$:';
            let tempBinValue: Uint8Array;
            switch (true) {
                case (typeof value === 'bigint'):

                    encodedValue += 'u64:';

                    if (value > MAX_U64) throw new Error(`BigInt value out of bounds for key "${key}"`);

                    if (!options || !options.u64 || options.u64 === 'dec') {
                        encodedValue += `dec:${value.toString(10)}`;
                    } else if (options.u64 === 'hex') {
                        encodedValue += `hex:${value.toString(16)}`;
                    } else {
                        throw new Error(`Unknown u64 encoding: "${options.u64}"; available options: "dec", "hex"`);
                    }

                    return encodedValue;

                case (ArrayBuffer.isView(value)):

                    encodedValue += 'bin:';
                    tempBinValue = new Uint8Array(value.buffer);

                    switch (true) {
                        case (!options || !options.bin || options.bin === 'hex'):
                            encodedValue += `hex:${hexEncode(tempBinValue)}`;
                            break;
                        case (options!.bin === 'b58'):
                            encodedValue += `b58:${base58Encode(tempBinValue)}`;
                            break;
                        case (options!.bin === 'b64'):
                            encodedValue += `b64:${base64Encode(tempBinValue)}`;
                            break;
                        case (options!.bin === 'b64url'):
                            encodedValue += `b64url:${base64UrlEncode(tempBinValue)}`;
                            break;
                        default:
                            throw new Error(`Unknown u64 encoding: "${options.bin}"; available options: "hex", "b58", "b64", "b64url"`);
                    }

                    return encodedValue;

                default:
                    return value;
            }
        },
        space,
    );
}
