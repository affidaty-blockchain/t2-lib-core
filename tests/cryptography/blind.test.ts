import { RSAKeyPair } from '../../src/cryptography/RSAKeyPair';
import { hexDecode, hexEncode } from '../../src/binConversions';
import {
    getFactor,
    applyBlinding,
    removeBlinding,
    addSalt,
    blindSign,
    encrypt,
    decrypt,
} from '../../src/cryptography/RSABlindSignature';

// !!!!!!!IMPORTANT: message max safe size in bytes = keySizeBytes - 1
// !!!!!!!IMPORTANT: salt max safe size in bytes = keySizeBytes - messageSizeBytes -1

describe('testing blind signature', () => {
    const rsaKeyPair = new RSAKeyPair();

    const message = hexDecode('122022264e20bc0cf4b49a7e7c9b4a0e427605a2e04a05255ee50cec3666d0cbbc1b');
    // salt that server will apply to blinded message from client before signing it.
    const salt = hexDecode('e52858b19cfe12e4742b55e1ad239e849818fb1c8ff1b47c64dbad50c361e9d2183750a8ca713fe806df5b40f30bca4128d1147412715462df570e144ea3a9ccfd999a677e313d19f1d560bbe9d96baba4fd8e0f92ba587d63c17bb5d9');

    test('init', async () => {
        await expect(rsaKeyPair.generate()).resolves.toBeTruthy();
    });
    test('Testing RSA class', async () => {
        // authority keys
        const pubKey = rsaKeyPair.publicKey;
        const privKey = rsaKeyPair.privateKey;

        // authority sends public key to client
        // client finds a blinding factor using received public key
        // (save it till the end of the process)
        const blindingFactor = await getFactor(pubKey);
        // client applies the blinding factor to the message and sends
        // the blinded message
        const blindedData = await applyBlinding(
            message,
            blindingFactor,
            pubKey,
        );

        // Authority applies a salt to received data
        const blindedSaltedData = await addSalt(blindedData, salt, pubKey);
        // Authority signs salted data with it's private key and sends it back to client
        const blindedSaltedSignature = await blindSign(blindedSaltedData, privKey);

        // clients can now remove the blinding from the received signature
        // and use it to send the anonymous vote
        const unblindedSaltedSignature = await removeBlinding(
            blindedSaltedSignature,
            blindingFactor,
            pubKey,
        );

        // algorithm correctness check
        const decryptedUnblindedSaltedSignature = await decrypt(
            unblindedSaltedSignature,
            pubKey,
            (message.length + salt.length),
        );

        const plainSaltedMessage = hexDecode(
            (
                BigInt(`0x${hexEncode(message)}`)
                * BigInt(`0x${hexEncode(salt)}`)
            ).toString(16).padStart((message.length + salt.length) * 2),
        );
        expect(decryptedUnblindedSaltedSignature).toEqual(plainSaltedMessage);
        const plainSaltedSignature = await encrypt(
            plainSaltedMessage,
            privKey,
            privKey.keyParams.genAlgorithm!.modulusLength! / 8,
        );
        expect(unblindedSaltedSignature).toEqual(plainSaltedSignature);
    });
});
