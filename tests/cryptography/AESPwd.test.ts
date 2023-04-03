import { AESPassEncrypt, AESPassDecrypt } from '../../src/cryptography/AES';

describe('Testing AES cryptography', () => {
    const testData = 'Hello world!';
    const password = 'secret';
    test('testing password encryption', async () => {
        const encryptedData = await AESPassEncrypt(
            password,
            new TextEncoder().encode(testData),
        );
        const decryptedData = new TextDecoder()
            .decode(await AESPassDecrypt(password, encryptedData));
        expect(decryptedData).toEqual(testData);
    });
});
