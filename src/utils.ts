/* eslint-disable no-plusplus */
/* eslint-disable no-bitwise */
/* eslint-disable no-nested-ternary */
import fastSha256 from 'fast-sha256';
import {
    encode as mpEnc,
    EncoderOptions,
    decode as mpDec,
    DecoderOptions,
} from '@msgpack/msgpack';

const defOptions = {
    useBigInt64: true,
    ignoreUndefined: true,
};

/** Serializes any javascript object into an array of bytes */
export function objectToBytes(obj: any, options: EncoderOptions = defOptions): Uint8Array {
    return mpEnc(obj, options);
}

/** Deserializes an array of bytes into a plain javascript
 * object */
export function bytesToObject(bytes: Uint8Array, options: DecoderOptions = defOptions): any {
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
            arraysLenSum += temp.byteLength;
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

export function toBuffer(arg: Uint8Array | ArrayBufferLike | string): Buffer {
    let result = Buffer.from([]);
    if (typeof arg === 'string') {
        result = Buffer.from(arg, 'hex');
    } else {
        result = Buffer.from(arg);
    }
    return result;
}

/**
 * Sequence generator function
 * @param start - Initial number (will be included).
 * @param stop - Final number (will be included).
 * @param step - Step between two consecutive numbers (default 1).
 * @returns - Array filled according to passed arguments with numbers.
 */
export function numRange(
    start: number,
    stop: number,
    step: number = 1,
): Array<number> {
    return Array.from(
        { length: (stop - start) / step + 1 },
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

export function UTF8ArrToStr(byteArray: Uint8Array): string {
    let sView = '';
    let nPart;
    const nLen = byteArray.length;
    for (let nIdx = 0; nIdx < nLen; nIdx += 1) {
        nPart = byteArray[nIdx];
        sView += String.fromCodePoint(
            nPart > 251 && nPart < 254 && nIdx + 5 < nLen /* six bytes */
                /* ? (nPart - 252 << 30) may be not so safe in ECMAScript! So…: */
                ? (nPart - 252) * 1073741824
                    + ((byteArray[nIdx += 1] - 128) << 24)
                    + ((byteArray[nIdx += 1] - 128) << 18)
                    + ((byteArray[nIdx += 1] - 128) << 12)
                    + ((byteArray[nIdx += 1] - 128) << 6)
                    + byteArray[nIdx += 1]
                    - 128
                : nPart > 247 && nPart < 252 && nIdx + 4 < nLen /* five bytes */
                    ? ((nPart - 248) << 24)
                        + ((byteArray[nIdx += 1] - 128) << 18)
                        + ((byteArray[nIdx += 1] - 128) << 12)
                        + ((byteArray[nIdx += 1] - 128) << 6)
                        + byteArray[nIdx += 1]
                        - 128
                    : nPart > 239 && nPart < 248 && nIdx + 3 < nLen /* four bytes */
                        ? ((nPart - 240) << 18)
                            + ((byteArray[nIdx += 1] - 128) << 12)
                            + ((byteArray[nIdx += 1] - 128) << 6)
                            + byteArray[nIdx += 1]
                            - 128
                        : nPart > 223 && nPart < 240 && nIdx + 2 < nLen /* three bytes */
                            ? ((nPart - 224) << 12)
                                + ((byteArray[nIdx += 1] - 128) << 6)
                                + byteArray[nIdx += 1]
                                - 128
                            : nPart > 191 && nPart < 224 && nIdx + 1 < nLen /* two bytes */
                                ? ((nPart - 192) << 6) + byteArray[nIdx += 1] - 128
                                : nPart,
        );
    }
    return sView;
}

export function strToUTF8Arr(sDOMStr: string): Uint8Array {
    let nChr: number;
    const nStrLen = sDOMStr.length;
    let nArrLen = 0;

    /* mapping… */
    for (let nMapIdx = 0; nMapIdx < nStrLen; nMapIdx++) {
        nChr = sDOMStr.codePointAt(nMapIdx)!;

        if (nChr >= 0x10000) {
            nMapIdx++;
        }

        nArrLen
        += nChr < 0x80
                ? 1
                : nChr < 0x800
                    ? 2
                    : nChr < 0x10000
                        ? 3
                        : nChr < 0x200000
                            ? 4
                            : nChr < 0x4000000
                                ? 5
                                : 6;
    }

    const aBytes = new Uint8Array(nArrLen);

    /* transcription… */
    let nIdx = 0;
    let nChrIdx = 0;
    while (nIdx < nArrLen) {
        nChr = sDOMStr.codePointAt(nChrIdx)!;
        if (nChr < 128) {
        /* one byte */
            aBytes[nIdx] = nChr;
        } else if (nChr < 0x800) {
        /* two bytes */
            aBytes[nIdx++] = 192 + (nChr >>> 6);
            aBytes[nIdx++] = 128 + (nChr & 63);
        } else if (nChr < 0x10000) {
        /* three bytes */
            aBytes[nIdx++] = 224 + (nChr >>> 12);
            aBytes[nIdx++] = 128 + ((nChr >>> 6) & 63);
            aBytes[nIdx++] = 128 + (nChr & 63);
        } else if (nChr < 0x200000) {
            /* four bytes */
            aBytes[nIdx++] = 240 + (nChr >>> 18);
            aBytes[nIdx++] = 128 + ((nChr >>> 12) & 63);
            aBytes[nIdx++] = 128 + ((nChr >>> 6) & 63);
            aBytes[nIdx++] = 128 + (nChr & 63);
            nChrIdx++;
        } else if (nChr < 0x4000000) {
        /* five bytes */
            aBytes[nIdx++] = 248 + (nChr >>> 24);
            aBytes[nIdx++] = 128 + ((nChr >>> 18) & 63);
            aBytes[nIdx++] = 128 + ((nChr >>> 12) & 63);
            aBytes[nIdx++] = 128 + ((nChr >>> 6) & 63);
            aBytes[nIdx++] = 128 + (nChr & 63);
            nChrIdx++;
        } /* if (nChr <= 0x7fffffff) */ else {
            /* six bytes */
            aBytes[nIdx++] = 252 + (nChr >>> 30);
            aBytes[nIdx++] = 128 + ((nChr >>> 24) & 63);
            aBytes[nIdx++] = 128 + ((nChr >>> 18) & 63);
            aBytes[nIdx++] = 128 + ((nChr >>> 12) & 63);
            aBytes[nIdx++] = 128 + ((nChr >>> 6) & 63);
            aBytes[nIdx++] = 128 + (nChr & 63);
            nChrIdx++;
        }
        nChrIdx++;
    }
    return aBytes;
}
