import fastSha256 from 'fast-sha256';
import {
    encode as mpEnc,
    EncoderOptions,
    decode as mpDec,
    DecoderOptions,
} from '@msgpack/msgpack';
import {
    regexBase58,
    fromBase58,
} from './binConversions';

const regexValidAccChars = /^[a-zA-Z0-9-_#]+$/;

const defMsgPackOptions = {
    useBigInt64: true,
    ignoreUndefined: true,
    initialBufferSize: 0,
};

export function xor(a: boolean, b: boolean): boolean {
    return a ? !b : b;
}

export function stringIsTrinciAccount(accountId: string): boolean {
    if (typeof accountId !== 'string' || accountId.length < 2) return false;
    if (accountId === 'TRINCI') return true;
    if (accountId.charAt(0) === '#') return regexValidAccChars.test(accountId);
    if (!accountId.match(regexBase58)) return false;
    const bytes = fromBase58(accountId);
    if (bytes.length !== 34) return false;
    if (bytes[0] !== 0x12 || bytes[1] !== 0x20) return false;
    return true;
}

/** Serializes any javascript object into an array of bytes */
export function objectToBytes(obj: any, options: EncoderOptions = defMsgPackOptions): Uint8Array {
    if (typeof obj === 'undefined') {
        throw new Error('Cannot encode "undefined"');
    }
    const result = mpEnc(obj, options);
    return result;
}

/** Deserializes an array of bytes into a plain javascript
 * object */
export function bytesToObject(bytes: Uint8Array, options: DecoderOptions = defMsgPackOptions): any {
    if (!bytes.length) {
        throw new Error('Cannot decode empty byte array.');
    }
    return mpDec(bytes, options);
}

/**
 * Produces sha256 hash of given data.
 * @param data - data to calculate hash from
 * @returns - sha256 hash of data
 */
export function sha256(data: Uint8Array): Uint8Array {
    return fastSha256(data);
}

/**
 * Produces a union of given arrays.
 * @param array - an array of arrays of the same type
 * @returns - An array composed from all the elements
 * of passed arrays, but without duplicates.
 */
export function arrayUnion<T>(array: Array<Array<T>>): Array<T> {
    const result: Array<T> = [];
    for (let i = 0; i < array.length; i += 1) {
        for (let j = 0; j < array[i].length; j += 1) {
            if (result.indexOf(array[i][j]) === -1) {
                result.push(array[i][j]);
            }
        }
    }
    return result;
}

export function concatBytes(...arrays: Array<ArrayBufferView | ArrayBufferLike>): ArrayBuffer {
    let arraysLenSum = 0;
    const offsets: number[] = [];
    const _arrays: Array<Uint8Array> = [];
    arrays.forEach((array) => {
        let temp: Uint8Array | null = null;
        if (array.byteLength) {
            if ((array as ArrayBufferView).buffer) {
                temp = new Uint8Array((array as ArrayBufferView).buffer);
            } else {
                temp = new Uint8Array(array as ArrayBufferLike);
            }
        }
        if (temp) {
            _arrays.push(temp);
            offsets.push(arraysLenSum);
            arraysLenSum += temp.length;
        }
    });

    const finalResult = new Uint8Array(arraysLenSum);
    for (let i = 0; i < _arrays.length; i += 1) {
        finalResult.set(_arrays[i], offsets[i]);
    }
    return finalResult.buffer;
}

/** Checks if two gived arrays are similar( have all the same elements,
 * regardless of the order ) */
export function similarArrays<T>(array1: Array<T>, array2: Array<T>): boolean {
    if (array1.length !== array2.length) {
        return false;
    }
    for (let i = 0; i < array1.length; i += 1) {
        if (array2.indexOf(array1[i]) === -1) {
            return false;
        }
    }
    return true;
}

/**
 * Sequence generator function
 * @param start - Initial number (included).
 * @param end - Final number (included).
 * @param step - Step between two consecutive numbers (default 1).
 * @returns - Array filled according to passed arguments with numbers.
 */
export function numRange(
    start: number,
    end: number,
    step: number = 1,
): Array<number> {
    return Array.from(
        { length: (end - start) / step + 1 },
        (_, i) => { return start + (i * step); },
    );
}

export function removeValuefromArray<T>(array: Array<T>, value: T): Array<T> {
    const index = array.indexOf(value);
    if (index !== -1) {
        array.splice(index, 1);
    }
    return array;
}
