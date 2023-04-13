import {
    Errors,
    toHex,
    fromHex,
    toBase58,
    fromBase58,
    toBase64,
    fromBase64,
    toBase64Url,
    fromBase64Url,
} from '../index';

describe('hex conversions', () => {
    test('bin -> hex', () => {
        expect(toHex(new Uint8Array([]))).toEqual('');
        expect(toHex(new Uint8Array([0]))).toEqual('00');
        expect(toHex(new Uint8Array([0, 0]))).toEqual('0000');
        expect(toHex(new Uint8Array([15, 0, 255, 0, 15]))).toEqual('0f00ff000f');
    });
    test('hex -> bin', () => {
        expect(() => { fromHex('ff00ff-'); }).toThrowError(Errors.NOT_HEX);
        expect(() => { fromHex('-ff00ff'); }).toThrowError(Errors.NOT_HEX);
        expect(() => { fromHex('ff0-0ff'); }).toThrowError(Errors.NOT_HEX);
        expect(() => { fromHex('-ff0-0ff-'); }).toThrowError(Errors.NOT_HEX);
        expect(fromHex('')).toEqual(new Uint8Array());
        expect(fromHex('0')).toEqual(new Uint8Array([0]));
        expect(fromHex('00')).toEqual(new Uint8Array([0]));
        expect(fromHex('000')).toEqual(new Uint8Array([0, 0]));
        expect(fromHex('0000')).toEqual(new Uint8Array([0, 0]));
        expect(fromHex('00102030405060708090a0b0c0d0e0fff')).toEqual(new Uint8Array(
            [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 255],
        ));
    });
});

describe('b58 conversions', () => {
    test('bin -> b58', () => {
        expect(toBase58(new Uint8Array([]))).toEqual('');
        expect(toBase58(new Uint8Array([0]))).toEqual('1');
        expect(toBase58(new Uint8Array([0, 0]))).toEqual('11');
        expect(toBase58(new Uint8Array([255, 0]))).toEqual('LQX');
        expect(toBase58(new Uint8Array([0, 255]))).toEqual('15Q');
        expect(toBase58(new Uint8Array([0xf9, 0xa7]))).toEqual('Kzv');
    });
    test('b58 -> bin', () => {
        expect(() => { fromBase58('-18DfbjXLth7APvt3qQPgxn'); }).toThrowError(Errors.NOT_B58);
        expect(() => { fromBase58('18DfbjXLth7APvt3qQPgxn-'); }).toThrowError(Errors.NOT_B58);
        expect(() => { fromBase58('18DfbjXLth-7APvt3qQPgxn'); }).toThrowError(Errors.NOT_B58);
        expect(() => { fromBase58('-18Dfb-jXLth7APv-t3qQPgxn-'); }).toThrowError(Errors.NOT_B58);
        expect(fromBase58('')).toEqual(new Uint8Array());
        expect(fromBase58('Kzv')).toEqual(new Uint8Array([0xf9, 0xa7]));
        expect(fromBase58('18DfbjXLth7APvt3qQPgxn')).toEqual(new Uint8Array(
            [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 255],
        ));
    });
});

describe('b64 conversions', () => {
    test('bin -> b64', () => {
        expect(toBase64(new Uint8Array([]))).toEqual('');
        expect(toBase64(new Uint8Array([0]))).toEqual('AA==');
        expect(toBase64(new Uint8Array([0, 0]))).toEqual('AAA=');
        expect(toBase64(new Uint8Array([255, 0]))).toEqual('/wA=');
        expect(toBase64(new Uint8Array([0, 255]))).toEqual('AP8=');
        expect(toBase64(new Uint8Array([0xf9, 0xa7]))).toEqual('+ac=');
        expect(toBase64(new Uint8Array([60, 60, 63, 63, 63, 62, 62]))).toEqual('PDw/Pz8+Pg==');
    });
    test('b64 -> bin', () => {
        expect(() => { fromBase64('?AAECAwQFBgcICQoLDA0OD/8='); }).toThrowError(Errors.NOT_B64);
        expect(() => { fromBase64('AAECAwQFBgcICQoLDA0OD/8=?'); }).toThrowError(Errors.NOT_B64);
        expect(() => { fromBase64('AAECAwQFBg?cICQoLDA0OD/8='); }).toThrowError(Errors.NOT_B64);
        expect(() => { fromBase64('?AAECAwQFBgcICQoLD?A0OD/8=?'); }).toThrowError(Errors.NOT_B64);
        expect(fromBase64('')).toEqual(new Uint8Array());
        expect(fromBase64('+ac=')).toEqual(new Uint8Array([0xf9, 0xa7]));
        expect(fromBase64('AAECAwQFBgcICQoLDA0OD/8=')).toEqual(new Uint8Array(
            [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 255],
        ));
        expect(fromBase64('PDw/Pz8+Pg==')).toEqual(new Uint8Array([60, 60, 63, 63, 63, 62, 62]));
    });
});

describe('b64url conversions', () => {
    test('bin -> b64url', () => {
        expect(toBase64Url(new Uint8Array([]))).toEqual('');
        expect(toBase64Url(new Uint8Array([0]))).toEqual('AA');
        expect(toBase64Url(new Uint8Array([0, 0]))).toEqual('AAA');
        expect(toBase64Url(new Uint8Array([255, 0]))).toEqual('_wA');
        expect(toBase64Url(new Uint8Array([0, 255]))).toEqual('AP8');
        expect(toBase64Url(new Uint8Array([0xf9, 0xa7]))).toEqual('-ac');
        expect(toBase64Url(new Uint8Array([60, 60, 63, 63, 63, 62, 62]))).toEqual('PDw_Pz8-Pg');
    });
    test('b64url -> bin', () => {
        expect(() => { fromBase64Url('PDw/Pz8-Pg'); }).toThrowError(Errors.NOT_B64URL);
        expect(() => { fromBase64Url('?PDw_Pz8-Pg'); }).toThrowError(Errors.NOT_B64URL);
        expect(() => { fromBase64Url('PDw_Pz8+Pg'); }).toThrowError(Errors.NOT_B64URL);
        expect(() => { fromBase64Url('PDw_Pz?8-Pg'); }).toThrowError(Errors.NOT_B64URL);
        expect(() => { fromBase64Url('PDw_Pz8-Pg=='); }).toThrowError(Errors.NOT_B64URL);
        expect(() => { fromBase64Url('PDw_Pz8-Pg?'); }).toThrowError(Errors.NOT_B64URL);
        expect(fromBase64Url('')).toEqual(new Uint8Array());
        expect(fromBase64Url('-ac')).toEqual(new Uint8Array([0xf9, 0xa7]));
        expect(fromBase64Url('AAECAwQFBgcICQoLDA0OD_8')).toEqual(new Uint8Array(
            [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 255],
        ));
        expect(fromBase64Url('PDw_Pz8-Pg')).toEqual(new Uint8Array([60, 60, 63, 63, 63, 62, 62]));
    });
});
