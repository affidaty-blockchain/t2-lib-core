/* eslint-disable max-len */
import { hexEncode } from '../src/binConversions';
import { bytesToObject } from '../src/utils';
import { jsonParse } from '../src/json';

describe('parse', () => {
    test('standart json parse', async () => {
        const jsonString = '{"bool": true, "num": 42, "null": null, "string": "testString", "arr": [true, 42, null, "testString"], "obj": {"bool": false, "num": 42, "string": "testString"}}';
        const parsedResult = jsonParse(jsonString);

        expect(typeof parsedResult.bool).toEqual('boolean');
        expect(parsedResult.bool).toBeTruthy();
        expect(typeof parsedResult.num).toEqual('number');
        expect(parsedResult.num).toEqual(42);
        expect(parsedResult.null === null).toBeTruthy();
        expect(typeof parsedResult.string).toEqual('string');
        expect(parsedResult.string).toEqual('testString');
        expect(Array.isArray(parsedResult.arr)).toBeTruthy();
        expect(parsedResult.arr).toEqual([true, 42, null, 'testString']);
        expect(typeof parsedResult.obj).toEqual('object');
        expect(parsedResult.obj).toEqual({ bool: false, num: 42, string: 'testString' });
    });

    test('custom json parse', async () => {
        const jsonString = '{"binUTF8":"$:bin:utf8:hello","binHex":"$:bin:hex:00ff00ff","binB58":"$:bin:b58:3xeAA","binB64":"$:bin:b64:Av8A/w==","binB64Url":"$:bin:b64url:A_8A_w","u64Hex":"$:u64:hex:FFFFFFFFFFFFFFFF","u64Dec":"$:u64:dec:18446744073709551614"}';
        const parsedResult: {
            binUTF8: Uint8Array,
            binHex: Uint8Array,
            binB58: Uint8Array,
            binB64: Uint8Array,
            binB64Url: Uint8Array,
            u64Hex: BigInt,
            u64Dec: BigInt,
        } = jsonParse(jsonString);

        expect(parsedResult.binUTF8 instanceof Uint8Array).toBeTruthy();
        expect(hexEncode(parsedResult.binUTF8)).toEqual('68656c6c6f');
        expect(parsedResult.binHex instanceof Uint8Array).toBeTruthy();
        expect(hexEncode(parsedResult.binHex)).toEqual('00ff00ff');
        expect(parsedResult.binB58 instanceof Uint8Array).toBeTruthy();
        expect(hexEncode(parsedResult.binB58)).toEqual('01ff00ff');
        expect(parsedResult.binB64 instanceof Uint8Array).toBeTruthy();
        expect(hexEncode(parsedResult.binB64)).toEqual('02ff00ff');
        expect(parsedResult.binB64Url instanceof Uint8Array).toBeTruthy();
        expect(hexEncode(parsedResult.binB64Url)).toEqual('03ff00ff');

        expect(parsedResult.u64Hex.toString(16)).toEqual('ffffffffffffffff');
        expect(parsedResult.u64Dec.toString(16)).toEqual('fffffffffffffffe');
        expect(true).toBeTruthy();
    });

    test('msgpack processor', async () => {
        const jsonString = '{"$:msgpack:msgpackTest": {"num": 42, "string": "testString", "binHex": "$:bin:hex:00ff00ff"}}';
        const parsedResult: {msgpackTest: Uint8Array} = jsonParse(jsonString);

        expect(parsedResult.msgpackTest instanceof Uint8Array).toBeTruthy();
        expect(hexEncode(parsedResult.msgpackTest)).toEqual('83a36e756d2aa6737472696e67aa74657374537472696e67a662696e486578c40400ff00ff');

        const decodedInternal = bytesToObject(parsedResult.msgpackTest);

        expect(typeof decodedInternal.num).toEqual('number');
        expect(decodedInternal.num).toEqual(42);
        expect(typeof decodedInternal.string).toEqual('string');
        expect(decodedInternal.string).toEqual('testString');
        expect(decodedInternal.binHex instanceof Uint8Array).toBeTruthy();
        expect(hexEncode(decodedInternal.binHex)).toEqual('00ff00ff');
    });
});
