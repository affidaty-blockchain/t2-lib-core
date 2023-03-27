import {
    Errors,
    hexEncode,
    hexDecode,
    b58Encode,
    b58Decode,
    b64Encode,
    b64Decode,
    b64UrlEncode,
    b64UrlDecode,
} from '../index';

describe('hex conversions', () => {
    test('bin -> hex', () => {
        expect(hexEncode(new Uint8Array([]))).toEqual('');
        expect(hexEncode(new Uint8Array([0]))).toEqual('00');
        expect(hexEncode(new Uint8Array([0, 0]))).toEqual('0000');
        expect(hexEncode(new Uint8Array([15, 0, 255, 0, 15]))).toEqual('0f00ff000f');
    });
    test('hex -> bin', () => {
        expect(() => { hexDecode('ff00ff-'); }).toThrowError(Errors.NOT_HEX);
        expect(() => { hexDecode('-ff00ff'); }).toThrowError(Errors.NOT_HEX);
        expect(() => { hexDecode('ff0-0ff'); }).toThrowError(Errors.NOT_HEX);
        expect(() => { hexDecode('-ff0-0ff-'); }).toThrowError(Errors.NOT_HEX);
        expect(hexDecode('')).toEqual(new Uint8Array());
        expect(hexDecode('0')).toEqual(new Uint8Array([0]));
        expect(hexDecode('00')).toEqual(new Uint8Array([0]));
        expect(hexDecode('000')).toEqual(new Uint8Array([0, 0]));
        expect(hexDecode('0000')).toEqual(new Uint8Array([0, 0]));
        expect(hexDecode('00102030405060708090a0b0c0d0e0fff')).toEqual(new Uint8Array(
            [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 255],
        ));
    });
});

describe('b58 conversions', () => {
    test('bin -> b58', () => {
        expect(b58Encode(new Uint8Array([]))).toEqual('');
        expect(b58Encode(new Uint8Array([0]))).toEqual('1');
        expect(b58Encode(new Uint8Array([0, 0]))).toEqual('11');
        expect(b58Encode(new Uint8Array([255, 0]))).toEqual('LQX');
        expect(b58Encode(new Uint8Array([0, 255]))).toEqual('15Q');
        expect(b58Encode(new Uint8Array([0xf9, 0xa7]))).toEqual('Kzv');
    });
    test('b58 -> bin', () => {
        expect(() => { b58Decode('-18DfbjXLth7APvt3qQPgxn'); }).toThrowError(Errors.NOT_B58);
        expect(() => { b58Decode('18DfbjXLth7APvt3qQPgxn-'); }).toThrowError(Errors.NOT_B58);
        expect(() => { b58Decode('18DfbjXLth-7APvt3qQPgxn'); }).toThrowError(Errors.NOT_B58);
        expect(() => { b58Decode('-18Dfb-jXLth7APv-t3qQPgxn-'); }).toThrowError(Errors.NOT_B58);
        expect(b58Decode('')).toEqual(new Uint8Array());
        expect(b58Decode('Kzv')).toEqual(new Uint8Array([0xf9, 0xa7]));
        expect(b58Decode('18DfbjXLth7APvt3qQPgxn')).toEqual(new Uint8Array(
            [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 255],
        ));
    });
});

describe('b64 conversions', () => {
    test('bin -> b64', () => {
        expect(b64Encode(new Uint8Array([]))).toEqual('');
        expect(b64Encode(new Uint8Array([0]))).toEqual('AA==');
        expect(b64Encode(new Uint8Array([0, 0]))).toEqual('AAA=');
        expect(b64Encode(new Uint8Array([255, 0]))).toEqual('/wA=');
        expect(b64Encode(new Uint8Array([0, 255]))).toEqual('AP8=');
        expect(b64Encode(new Uint8Array([0xf9, 0xa7]))).toEqual('+ac=');
        expect(b64Encode(new Uint8Array([60, 60, 63, 63, 63, 62, 62]))).toEqual('PDw/Pz8+Pg==');
    });
    test('b64 -> bin', () => {
        expect(() => { b64Decode('?AAECAwQFBgcICQoLDA0OD/8='); }).toThrowError(Errors.NOT_B64);
        expect(() => { b64Decode('AAECAwQFBgcICQoLDA0OD/8=?'); }).toThrowError(Errors.NOT_B64);
        expect(() => { b64Decode('AAECAwQFBg?cICQoLDA0OD/8='); }).toThrowError(Errors.NOT_B64);
        expect(() => { b64Decode('?AAECAwQFBgcICQoLD?A0OD/8=?'); }).toThrowError(Errors.NOT_B64);
        expect(b64Decode('')).toEqual(new Uint8Array());
        expect(b64Decode('+ac=')).toEqual(new Uint8Array([0xf9, 0xa7]));
        expect(b64Decode('AAECAwQFBgcICQoLDA0OD/8=')).toEqual(new Uint8Array(
            [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 255],
        ));
        expect(b64Decode('PDw/Pz8+Pg==')).toEqual(new Uint8Array([60, 60, 63, 63, 63, 62, 62]));
    });
});

describe('b64url conversions', () => {
    test('bin -> b64url', () => {
        expect(b64UrlEncode(new Uint8Array([]))).toEqual('');
        expect(b64UrlEncode(new Uint8Array([0]))).toEqual('AA');
        expect(b64UrlEncode(new Uint8Array([0, 0]))).toEqual('AAA');
        expect(b64UrlEncode(new Uint8Array([255, 0]))).toEqual('_wA');
        expect(b64UrlEncode(new Uint8Array([0, 255]))).toEqual('AP8');
        expect(b64UrlEncode(new Uint8Array([0xf9, 0xa7]))).toEqual('-ac');
        expect(b64UrlEncode(new Uint8Array([60, 60, 63, 63, 63, 62, 62]))).toEqual('PDw_Pz8-Pg');
    });
    test('b64url -> bin', () => {
        expect(() => { b64UrlDecode('PDw/Pz8-Pg'); }).toThrowError(Errors.NOT_B64URL);
        expect(() => { b64UrlDecode('?PDw_Pz8-Pg'); }).toThrowError(Errors.NOT_B64URL);
        expect(() => { b64UrlDecode('PDw_Pz8+Pg'); }).toThrowError(Errors.NOT_B64URL);
        expect(() => { b64UrlDecode('PDw_Pz?8-Pg'); }).toThrowError(Errors.NOT_B64URL);
        expect(() => { b64UrlDecode('PDw_Pz8-Pg=='); }).toThrowError(Errors.NOT_B64URL);
        expect(() => { b64UrlDecode('PDw_Pz8-Pg?'); }).toThrowError(Errors.NOT_B64URL);
        expect(b64UrlDecode('')).toEqual(new Uint8Array());
        expect(b64UrlDecode('-ac')).toEqual(new Uint8Array([0xf9, 0xa7]));
        expect(b64UrlDecode('AAECAwQFBgcICQoLDA0OD_8')).toEqual(new Uint8Array(
            [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 255],
        ));
        expect(b64UrlDecode('PDw_Pz8-Pg')).toEqual(new Uint8Array([60, 60, 63, 63, 63, 62, 62]));
    });
});
