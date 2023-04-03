import { hexDecode } from '../../src/binConversions';
import { Account } from '../../src/account';
import {
    SignableTypeTags,
} from '../../src/transaction/commonParentTxData';
import { BulkRootTransaction } from '../../src/transaction/bulkRootTransaction';

const signerAcc = new Account();
let expectedTicket = '';

const txTestData = {
    target: '#TargetAcc',
    nonceHex: 'fa89be10c4f7c36e',
    maxFuel: 3000,
    network: 'QmcvHfPC6XYpgxvJSZQCVBd7QAMEHnLbbK1ytA4McWx5UY',
    contractHashHex: '1220ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
    contractMethod: 'pay',
    contractArgsHex: '84a466726f6dd92e516d64647852657845354451383248513448487171697936706e4a385241365a67464563397833534c7757564769a2746fad234f72646572426f6f6b303335a5756e697473cd1e84a464617461dc0049cc83cca5746f6b656ecca423425443cca5756e697473ccce0004cc93cce0cca3756964ccd92c346e7a336150774b54674d6754586e635762313779394c624d6169337448536e37483944396e7a7936503636',
    dependsOnHex: '12209cbc82cd55810d89184edc956bffef92c8e292d11e5047d787ade31f0a0865b4',
    signerAcc: new Account(),
};

describe('preliminary ops', () => {
    test('keys generation', async () => {
        await signerAcc.generate();
    });
});

describe('BulkRootTransaction', () => {
    test('empty/full automatic tag change', async () => {
        const tx = new BulkRootTransaction();
        expect(tx.typeTag).toEqual(SignableTypeTags.BULK_ROOT_TX);
        tx.maxFuel = BigInt(txTestData.maxFuel);
        expect(tx.maxFuel).toEqual(BigInt(txTestData.maxFuel));
        tx.networkName = txTestData.network;
        expect(tx.networkName).toEqual(txTestData.network);
        tx.nonceHex = txTestData.nonceHex;
        expect(tx.nonceHex).toEqual(txTestData.nonceHex);
        expect(tx.nonce).toEqual(hexDecode(txTestData.nonceHex));
        tx.signerPublicKey = signerAcc.keyPair.publicKey;
        expect(tx.signerPublicKey).toEqual(signerAcc.keyPair.publicKey);
        expect(tx.sign(signerAcc.keyPair.privateKey)).rejects.toBeDefined();

        const txUnnamedObj = await tx.toUnnamedObject();
        const tx2 = new BulkRootTransaction();
        await tx2.fromUnnamedObject(txUnnamedObj);
        expect(tx2.typeTag).toEqual(SignableTypeTags.BULK_EMPTY_ROOT_TX);
        expect(await tx2.getTicket()).toEqual(await tx.getTicket());

        const txObj = await tx.toObject();
        const tx3 = new BulkRootTransaction();
        await tx3.fromObject(txObj);
        expect(tx3.typeTag).toEqual(SignableTypeTags.BULK_EMPTY_ROOT_TX);
        expect(await tx3.getTicket()).toEqual(await tx.getTicket());

        const txBytes = await tx.toBytes();
        const tx4 = new BulkRootTransaction();
        await tx4.fromBytes(txBytes);
        expect(tx4.typeTag).toEqual(SignableTypeTags.BULK_EMPTY_ROOT_TX);
        expect(await tx4.getTicket()).toEqual(await tx.getTicket());

        const txB58 = await tx.toBase58();
        const tx5 = new BulkRootTransaction();
        await tx5.fromBase58(txB58);
        expect(tx5.typeTag).toEqual(SignableTypeTags.BULK_EMPTY_ROOT_TX);
        expect(await tx5.getTicket()).toEqual(await tx.getTicket());
    });
    test('accessors', async () => {
        const tx = new BulkRootTransaction();
        tx.target = txTestData.target;
        expect(tx.target).toEqual(txTestData.target);
        tx.maxFuel = BigInt(txTestData.maxFuel);
        expect(tx.maxFuel).toEqual(BigInt(txTestData.maxFuel));
        tx.networkName = txTestData.network;
        expect(tx.networkName).toEqual(txTestData.network);
        tx.nonceHex = txTestData.nonceHex;
        expect(tx.nonceHex).toEqual(txTestData.nonceHex);
        expect(tx.nonce).toEqual(hexDecode(txTestData.nonceHex));
        tx.smartContractHashHex = txTestData.contractHashHex;
        expect(tx.smartContractHash).toEqual(hexDecode(txTestData.contractHashHex));
        expect(tx.smartContractHashHex).toEqual(txTestData.contractHashHex);
        tx.smartContractMethod = txTestData.contractMethod;
        expect(tx.smartContractMethod).toEqual(txTestData.contractMethod);
        tx.smartContractMethodArgsHex = txTestData.contractArgsHex;
        expect(tx.smartContractMethodArgsHex).toEqual(txTestData.contractArgsHex);
        expect(tx.smartContractMethodArgsBytes).toEqual(hexDecode(txTestData.contractArgsHex));
        tx.signerPublicKey = signerAcc.keyPair.publicKey;
        expect(tx.signerPublicKey).toEqual(signerAcc.keyPair.publicKey);
        expectedTicket = await tx.getTicket();
    });
    test('sign/verify', async () => {
        const tx = new BulkRootTransaction()
            .setTarget(txTestData.target)
            .setMaxFuel(txTestData.maxFuel)
            .setNetworkName(txTestData.network)
            .setNonce(txTestData.nonceHex)
            .setSmartContractHash(txTestData.contractHashHex)
            .setSmartContractMethod(txTestData.contractMethod)
            .setSmartContractMethodArgsHex(txTestData.contractArgsHex)
            .setSignerPublicKey(signerAcc.keyPair.publicKey);
        expect(tx.sign(signerAcc.keyPair.privateKey)).rejects.toBeDefined();
        expect(tx.verify()).rejects.toBeDefined();
        expect(tx.typeTag).toEqual(SignableTypeTags.BULK_ROOT_TX);
        expect(tx.getTicket()).resolves.toEqual(expectedTicket);
    });
    test('to/from unnamed object', async () => {
        const tx = new BulkRootTransaction()
            .setTarget(txTestData.target)
            .setMaxFuel(txTestData.maxFuel)
            .setNetworkName(txTestData.network)
            .setNonce(txTestData.nonceHex)
            .setSmartContractHash(txTestData.contractHashHex)
            .setSmartContractMethod(txTestData.contractMethod)
            .setSmartContractMethodArgsHex(txTestData.contractArgsHex)
            .setSignerPublicKey(signerAcc.keyPair.publicKey);
        expect(tx.getTicket()).resolves.toEqual(expectedTicket);
        expect(tx.typeTag).toEqual(SignableTypeTags.BULK_ROOT_TX);

        const txUnnamedObj = await tx.toUnnamedObject();
        const tx2 = new BulkRootTransaction();
        await tx2.fromUnnamedObject(txUnnamedObj);
        expect(tx2.typeTag).toEqual(SignableTypeTags.BULK_ROOT_TX);
        expect(await tx2.toUnnamedObject()).toEqual(await tx.toUnnamedObject());
        expect(tx2.getTicket()).resolves.toEqual(expectedTicket);
    });
    test('to/from object', async () => {
        const tx = new BulkRootTransaction()
            .setTarget(txTestData.target)
            .setMaxFuel(txTestData.maxFuel)
            .setNetworkName(txTestData.network)
            .setNonce(txTestData.nonceHex)
            .setSmartContractHash(txTestData.contractHashHex)
            .setSmartContractMethod(txTestData.contractMethod)
            .setSmartContractMethodArgsHex(txTestData.contractArgsHex)
            .setSignerPublicKey(signerAcc.keyPair.publicKey);
        expect(tx.getTicket()).resolves.toEqual(expectedTicket);
        expect(tx.typeTag).toEqual(SignableTypeTags.BULK_ROOT_TX);

        const txObj = await tx.toObject();
        const tx2 = new BulkRootTransaction();
        await tx2.fromObject(txObj);
        expect(tx2.typeTag).toEqual(SignableTypeTags.BULK_ROOT_TX);
        expect(await tx2.toObject()).toEqual(await tx.toObject());
        expect(tx2.getTicket()).resolves.toEqual(expectedTicket);
    });
    test('to/from bytes', async () => {
        const tx = new BulkRootTransaction()
            .setTarget(txTestData.target)
            .setMaxFuel(txTestData.maxFuel)
            .setNetworkName(txTestData.network)
            .setNonce(txTestData.nonceHex)
            .setSmartContractHash(txTestData.contractHashHex)
            .setSmartContractMethod(txTestData.contractMethod)
            .setSmartContractMethodArgsBytes(hexDecode(txTestData.contractArgsHex))
            .setSignerPublicKey(signerAcc.keyPair.publicKey);
        expect(tx.getTicket()).resolves.toEqual(expectedTicket);
        expect(tx.typeTag).toEqual(SignableTypeTags.BULK_ROOT_TX);

        const txBytes = await tx.toBytes();
        const tx2 = new BulkRootTransaction();
        await tx2.fromBytes(txBytes);
        expect(tx2.typeTag).toEqual(SignableTypeTags.BULK_ROOT_TX);
        expect(await tx2.toBytes()).toEqual(await tx.toBytes());
        expect(tx2.getTicket()).resolves.toEqual(expectedTicket);
    });
    test('to/from base58', async () => {
        const tx = new BulkRootTransaction()
            .setTarget(txTestData.target)
            .setMaxFuel(txTestData.maxFuel)
            .setNetworkName(txTestData.network)
            .setNonce(txTestData.nonceHex)
            .setSmartContractHash(txTestData.contractHashHex)
            .setSmartContractMethod(txTestData.contractMethod)
            .setSmartContractMethodArgsBytes(hexDecode(txTestData.contractArgsHex))
            .setSignerPublicKey(signerAcc.keyPair.publicKey);
        expect(tx.getTicket()).resolves.toEqual(expectedTicket);
        expect(tx.typeTag).toEqual(SignableTypeTags.BULK_ROOT_TX);

        const txB58 = await tx.toBase58();
        const tx2 = new BulkRootTransaction();
        await tx2.fromBase58(txB58);
        expect(tx2.typeTag).toEqual(SignableTypeTags.BULK_ROOT_TX);
        expect(await tx2.toBase58()).toEqual(await tx.toBase58());
        expect(tx2.getTicket()).resolves.toEqual(expectedTicket);
    });
});
