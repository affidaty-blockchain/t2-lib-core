import {
    hexDecode,
    ECDSAKey,
    Account,
    UnitaryTransaction,
} from '../../index';

const signerPrivKeyHex = '3081bf020100301006072a8648ce3d020106052b810400220481a73081a40201010430381072124b4aa0a91cde416a1b7f6eae25f1363c7b9340b0063bba0479d7bf71b2d2669a93024a23197a9a4a47f2134ca00706052b81040022a164036200049964a33e0c892d69860aa0e6e67632b3143e1829a445d92037474d94423c70866079be0ea4884733bf45b5a57b2935e88d3eb516f34f9d4677d57e4eb45a6fe42e5a54cdac389067425b938fbd6831e89d935bf014317c14878ab69480db57c4';
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
    test('-', async () => {
        const signerPrivKey = new ECDSAKey('private');
        await signerPrivKey.setPKCS8(hexDecode(signerPrivKeyHex));
        await txTestData.signerAcc.setPrivateKey(signerPrivKey);
    });
});

describe('UnitaryTransaction', () => {
    test('sign/verify', async () => {
        const uTx = new UnitaryTransaction()
            .setTarget(txTestData.target)
            .setMaxFuel(txTestData.maxFuel)
            .setNetworkName(txTestData.network)
            .setNonce(txTestData.nonceHex)
            .setSmartContractHash(txTestData.contractHashHex)
            .setSmartContractMethod(txTestData.contractMethod)
            .setSmartContractMethodArgsHex(txTestData.contractArgsHex);
        await uTx.sign(txTestData.signerAcc.keyPair.privateKey);
        expect(uTx.verify()).resolves.toBeTruthy();
        uTx.target = '#anotherTarget';
        expect(uTx.verify()).resolves.toBeFalsy();
        uTx.setTarget(txTestData.target);
        expect(uTx.verify()).resolves.toBeTruthy();
    });
});
