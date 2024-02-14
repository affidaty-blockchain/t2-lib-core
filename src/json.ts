import * as Errors from './errors';

import { objectToBytes } from './utils';

import {
    regexDigits,
    regexHex,
    hexDecode,
    base58Decode,
    base64Decode,
    base64UrlDecode,
} from './binConversions';

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
            if (result < BigInt(0) || result > BigInt('0xffffffffffffffff')) {
                throw new Error('Value out of bounds.');
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
