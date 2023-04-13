import {
    fromHex,
    Signable,
    ECDSAKeyPair,
    ECDHKeyPair,
} from '../index';

describe('signable', () => {
    const ecdsa = new ECDSAKeyPair();
    const ecdh = new ECDHKeyPair();
    const testData = {
        a: 42,
        b: 'string',
        c: [
            'a',
            true,
            3.14,
        ],
        d: fromHex('ff00ff00ff'),
    };

    test('init', async () => {
        await expect(ecdsa.generate()).resolves.toBeTruthy();
        await expect(ecdh.generate()).resolves.toBeTruthy();
    });

    test('accessors', async () => {
        const s = new Signable();
        s.data = 'string';
        expect(s.data).toEqual('string');
        s.setData(testData);
        expect(s.data).toEqual(testData);
        s.signature = new Uint8Array([0xff, 0xfa]);
        expect(s.signature).toEqual(new Uint8Array([0xff, 0xfa]));
        expect(s.signatureHex).toEqual('fffa');
        s.signatureHex = 'ff00ff';
        expect(s.signature).toEqual(new Uint8Array([0xff, 0x00, 0xff]));
        expect(s.signatureHex).toEqual('ff00ff');
        s.setSignature('ff');
        expect(s.signature).toEqual(new Uint8Array([0xff]));
        expect(s.signatureHex).toEqual('ff');
        s.setSignature(new Uint8Array([0xbb, 0xcc]));
        expect(s.signature).toEqual(new Uint8Array([0xbb, 0xcc]));
        expect(s.signatureHex).toEqual('bbcc');
    });

    test('sign/verifySignature', async () => {
        const s = new Signable();
        s.data = testData;
        await expect(s.sign(ecdh.privateKey)).rejects.toThrow('Unable to use this key to sign');
        await expect(s.sign(ecdsa.publicKey)).rejects.toThrow('Unable to use this key to sign');
        await expect(s.sign(ecdsa.privateKey)).resolves.toBeTruthy();
        const ecdsa2 = new ECDSAKeyPair();
        await ecdsa2.generate();
        await expect(s.verifySignature(ecdh.publicKey)).rejects.toThrow('Unable to use this key to verify');
        await expect(s.verifySignature(ecdsa.privateKey)).rejects.toThrow('Unable to use this key to verify');
        await expect(s.verifySignature(ecdsa2.publicKey)).resolves.toBeFalsy();
        await expect(s.verifySignature(ecdsa.publicKey)).resolves.toBeTruthy();
    });

    test('to/from unnamed object', async () => {
        const s = new Signable();
        s.data = testData;
        await expect(s.sign(ecdsa.privateKey)).resolves.toBeTruthy();
        const sObj = await s.toUnnamedObject();

        const s2 = new Signable();
        await expect(s2.fromUnnamedObject(sObj)).resolves.toBeTruthy();
        expect(s2).toEqual(s);
        await expect(s2.verifySignature(ecdsa.publicKey)).resolves.toBeTruthy();
        s2.data.b = 'string0';
        await expect(s2.verifySignature(ecdsa.publicKey)).resolves.toBeFalsy();
        s2.data.b = 'string';
        await expect(s2.verifySignature(ecdsa.publicKey)).resolves.toBeTruthy();
        s2.data.d = fromHex('ff00ff00fe');
        await expect(s2.verifySignature(ecdsa.publicKey)).resolves.toBeFalsy();
        s2.data.d = fromHex('ff00ff00ff');
        await expect(s2.verifySignature(ecdsa.publicKey)).resolves.toBeTruthy();
    });

    test('to/from object', async () => {
        const s = new Signable();
        s.data = testData;
        await expect(s.sign(ecdsa.privateKey)).resolves.toBeTruthy();
        const sObj = await s.toObject();

        const s2 = new Signable();
        await expect(s2.fromObject(sObj)).resolves.toBeTruthy();
        expect(s2).toEqual(s);
        await expect(s2.verifySignature(ecdsa.publicKey)).resolves.toBeTruthy();
        s2.data.b = 'string0';
        await expect(s2.verifySignature(ecdsa.publicKey)).resolves.toBeFalsy();
        s2.data.b = 'string';
        await expect(s2.verifySignature(ecdsa.publicKey)).resolves.toBeTruthy();
        s2.data.d = fromHex('ff00ff00fe');
        await expect(s2.verifySignature(ecdsa.publicKey)).resolves.toBeFalsy();
        s2.data.d = fromHex('ff00ff00ff');
        await expect(s2.verifySignature(ecdsa.publicKey)).resolves.toBeTruthy();
    });

    test('to/from bytes', async () => {
        const s = new Signable();
        s.data = testData;
        await expect(s.sign(ecdsa.privateKey)).resolves.toBeTruthy();
        const sBytes = await s.toBytes();

        const s2 = new Signable();
        await expect(s2.fromBytes(sBytes)).resolves.toBeTruthy();
        expect(s2).toEqual(s);
        await expect(s2.verifySignature(ecdsa.publicKey)).resolves.toBeTruthy();
        s2.data.b = 'string0';
        await expect(s2.verifySignature(ecdsa.publicKey)).resolves.toBeFalsy();
        s2.data.b = 'string';
        await expect(s2.verifySignature(ecdsa.publicKey)).resolves.toBeTruthy();
        s2.data.d = fromHex('ff00ff00fe');
        await expect(s2.verifySignature(ecdsa.publicKey)).resolves.toBeFalsy();
        s2.data.d = fromHex('ff00ff00ff');
        await expect(s2.verifySignature(ecdsa.publicKey)).resolves.toBeTruthy();
    });

    test('to/from base58', async () => {
        const s = new Signable();
        s.data = testData;
        await expect(s.sign(ecdsa.privateKey)).resolves.toBeTruthy();

        const b58 = await s.toBase58();
        const s2 = new Signable();
        await expect(s2.fromBase58(b58)).resolves.toBeTruthy();
        expect(s2).toEqual(s);
        await expect(s2.verifySignature(ecdsa.publicKey)).resolves.toBeTruthy();
        s2.data.b = 'string0';
        await expect(s2.verifySignature(ecdsa.publicKey)).resolves.toBeFalsy();
        s2.data.b = 'string';
        await expect(s2.verifySignature(ecdsa.publicKey)).resolves.toBeTruthy();
        s2.data.d = fromHex('ff00ff00fe');
        await expect(s2.verifySignature(ecdsa.publicKey)).resolves.toBeFalsy();
        s2.data.d = fromHex('ff00ff00ff');
        await expect(s2.verifySignature(ecdsa.publicKey)).resolves.toBeTruthy();
    });
});
