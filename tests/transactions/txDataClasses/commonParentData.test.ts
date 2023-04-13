import { fromHex } from '../../../src/binConversions';
import { ECDSAKeyPair } from '../../../src/cryptography/ECDSAKeyPair';
import {
    CommonParentTxData,
    TxSchemas,
    SignableTypeTags,
} from '../../../src/transaction/commonParentTxData';

describe('common parent data class', () => {
    test('constructor', async () => {
        let data: CommonParentTxData;
        expect(() => { data = new CommonParentTxData('wrong'); }).toThrow();
        data = new CommonParentTxData(TxSchemas.EMPTY_TX);
        expect(data.typeTag).toEqual(SignableTypeTags.EMPTY_TX);
        data = new CommonParentTxData(TxSchemas.BULK_EMPTY_ROOT_TX);
        expect(data.typeTag).toEqual(SignableTypeTags.BULK_EMPTY_ROOT_TX);
        data = new CommonParentTxData(TxSchemas.BULK_ROOT_TX);
        expect(data.typeTag).toEqual(SignableTypeTags.BULK_ROOT_TX);
        data = new CommonParentTxData(TxSchemas.BULK_NODE_TX);
        expect(data.typeTag).toEqual(SignableTypeTags.BULK_NODE_TX);
        data = new CommonParentTxData(TxSchemas.BULK_TX);
        expect(data.typeTag).toEqual(SignableTypeTags.BULK_TX);
        data = new CommonParentTxData(TxSchemas.UNITARY_TX);
        expect(data.typeTag).toEqual(SignableTypeTags.UNITARY_TX);
        expect(data.nonce.length).toEqual(8);
    });
    test('accessors', async () => {
        const data: CommonParentTxData = new CommonParentTxData();

        data.typeTag = 'myType';
        expect(data.typeTag).toEqual('myType');

        // unknown schema
        expect(() => { data.schema = 'mySchema'; }).toThrow();
        data.schema = TxSchemas.UNITARY_TX;
        expect(data.schema).toEqual(TxSchemas.UNITARY_TX);

        expect(() => { data.target = 'myTarget'; }).toThrow();
        expect(() => { data.target = '#myTarget='; }).toThrow();
        data.target = '#myTarget';
        expect(data.target).toEqual('#myTarget');
        data.target = '#my-Target';
        expect(data.target).toEqual('#my-Target');
        data.target = '#my_Target';
        expect(data.target).toEqual('#my_Target');
        expect(() => { data.target = '6PMX8GYUanScPkK4fsoz52Z2w3DEFi6dcyYMA71vf5hFL'; }).toThrow();
        expect(() => { data.target = 'QmxoHT6iViN5xAjoz1VZ553cL31U9F94ht3QvWR1FrEbZY'; }).toThrow();
        expect(() => { data.target = 'QmxoHT6iViN5xAjoz1VZ553cL31U9F94ht3QvWR1FrEbZY='; }).toThrow();
        data.target = 'QmfZy5bvk7a3DQAjCbGNtmrPXWkyVvPrdnZMyBZ5q5ieKG';
        expect(data.target).toEqual('QmfZy5bvk7a3DQAjCbGNtmrPXWkyVvPrdnZMyBZ5q5ieKG');

        data.maxFuel = 10000;
        expect(data.maxFuel).toEqual(10000);

        data.networkName = 'myNetwork';
        expect(data.networkName).toEqual('myNetwork');

        data.nonce = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7]);
        expect(data.nonce).toEqual(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7]));
        expect(data.nonceHex).toEqual('0001020304050607');
        // not a hex string
        expect(() => { data.nonceHex = '=0706050=403020100='; }).toThrow();

        // leading 0s assumed
        data.nonceHex = '07060504030201';
        expect(data.nonce).toEqual(new Uint8Array([0, 7, 6, 5, 4, 3, 2, 1]));
        expect(data.nonceHex).toEqual('0007060504030201');
        data.nonceHex = '0706050403020100';
        expect(data.nonce).toEqual(new Uint8Array([7, 6, 5, 4, 3, 2, 1, 0]));
        expect(data.nonceHex).toEqual('0706050403020100');

        const contractHash = new Uint8Array([
            0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
            10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
            20, 21, 22, 23, 24, 25, 26, 27, 28, 29,
            30, 31, 32, 33,
        ]);
        const contractHashTooLong = new Uint8Array([
            0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
            10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
            20, 21, 22, 23, 24, 25, 26, 27, 28, 29,
            30, 31, 32, 33, 34,
        ]);
        const contractHashTooShort = new Uint8Array([
            0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
            10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
            20, 21, 22, 23, 24, 25, 26, 27, 28, 29,
            30, 31, 32,
        ]);
        const hashHex = '21201f1e1d1c1b1a191817161514131211100f0e0d0c0b0a09080706050403020100';
        const hashHexTooLong = '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f2021ff';
        const hashHexTooShort = '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20';
        data.smartContractHash = new Uint8Array([]);
        expect(data.smartContractHash).toEqual(new Uint8Array([]));
        expect(data.smartContractHashHex).toEqual('');
        data.smartContractHash = null;
        expect(data.smartContractHash).toEqual(new Uint8Array([]));
        expect(data.smartContractHashHex).toEqual('');
        expect(() => { data.smartContractHash = contractHashTooLong; }).toThrow();
        expect(() => { data.smartContractHash = contractHashTooShort; }).toThrow();
        expect(() => { data.smartContractHashHex = hashHexTooLong; }).toThrow();
        expect(() => { data.smartContractHashHex = hashHexTooShort; }).toThrow();
        data.smartContractHash = contractHash;
        expect(data.smartContractHash).toEqual(contractHash);
        data.smartContractHashHex = hashHex;
        expect(data.smartContractHashHex).toEqual(hashHex);

        expect(() => { data.smartContractMethod = ''; }).toThrow();
        data.smartContractMethod = 'my_method';
        expect(data.smartContractMethod).toEqual('my_method');

        expect(() => { data.dependsOn = new Uint8Array([0xff]); }).toThrow();
        expect(() => { data.dependsOnHex = 'ff'; }).toThrow();
        expect(() => { data.dependsOnHex = '1220ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'; }).toThrow();
        expect(() => { data.dependsOnHex = '1220ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'; }).toThrow();
        data.dependsOnHex = '1220ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
        expect(data.dependsOn).toEqual(new Uint8Array([
            18, 32, 255, 255, 255, 255, 255,
            255, 255, 255, 255, 255, 255, 255,
            255, 255, 255, 255, 255, 255, 255,
            255, 255, 255, 255, 255, 255, 255,
            255, 255, 255, 255, 255, 255,
        ]));
        data.dependsOnHex = '';
        expect(data.dependsOn).toEqual(new Uint8Array([]));

        // data.smartContractMethodArgsBytes = new Uint8Array([]);
        // cannot encode undefined
        expect(() => { data.smartContractMethodArgs = undefined; }).toThrow();
        // invalid hex string
        expect(() => { data.smartContractMethodArgsHex = 'ff==00'; }).toThrow();
        // incorrect json string
        expect(() => { data.smartContractMethodArgsJson = '{"key":val}'; }).toThrow();
        data.smartContractMethodArgsBytes = fromHex('81a36b6579a376616c');
        expect(data.smartContractMethodArgsBytes).toEqual(fromHex('81a36b6579a376616c'));
        expect(data.smartContractMethodArgsHex).toEqual('81a36b6579a376616c');
        expect(data.smartContractMethodArgsJson).toEqual('{"key":"val"}');
        expect(data.smartContractMethodArgs).toEqual({ key: 'val' });
        data.smartContractMethodArgsHex = '81a46b657931a476616c31';
        expect(data.smartContractMethodArgsBytes).toEqual(fromHex('81a46b657931a476616c31'));
        expect(data.smartContractMethodArgsHex).toEqual('81a46b657931a476616c31');
        expect(data.smartContractMethodArgsJson).toEqual('{"key1":"val1"}');
        expect(data.smartContractMethodArgs).toEqual({ key1: 'val1' });
        data.smartContractMethodArgs = { key2: 'val2' };
        expect(data.smartContractMethodArgsBytes).toEqual(fromHex('81a46b657932a476616c32'));
        expect(data.smartContractMethodArgsHex).toEqual('81a46b657932a476616c32');
        expect(data.smartContractMethodArgsJson).toEqual('{"key2":"val2"}');
        expect(data.smartContractMethodArgs).toEqual({ key2: 'val2' });
        data.smartContractMethodArgsJson = '{"key3":"val3"}';
        expect(data.smartContractMethodArgsBytes).toEqual(fromHex('81a46b657933a476616c33'));
        expect(data.smartContractMethodArgsHex).toEqual('81a46b657933a476616c33');
        expect(data.smartContractMethodArgsJson).toEqual('{"key3":"val3"}');
        expect(data.smartContractMethodArgs).toEqual({ key3: 'val3' });

        const keyPair = new ECDSAKeyPair();
        await keyPair.generate();
        expect(() => { data.signerPublicKey = keyPair.privateKey; }).toThrow();
        data.signerPublicKey = keyPair.publicKey;
        expect(data.signerPublicKey).toEqual(keyPair.publicKey);
    });
    test('methods', async () => {
        // aSDASDASD
        let data: CommonParentTxData;
        data = new CommonParentTxData().setTypeTag('myType');
        expect(data.typeTag).toEqual('myType');
        expect(() => { data = data.setSchema('invalid'); }).toThrow();
        data = data.setSchema(TxSchemas.EMPTY_TX);
        expect(data.schema).toEqual(TxSchemas.EMPTY_TX);
        data = data.setTarget('#Target');
        expect(data.target).toEqual('#Target');
        data = data.setMaxFuel('10000');
        expect(data.maxFuel).toEqual(10000);
        data = data.setNetworkName('my_network');
        expect(data.networkName).toEqual('my_network');
        data = data.setNonce('ffffffffffffffff');
        expect(data.nonce).toEqual(fromHex('ffffffffffffffff'));
        data = data.genNonce();
        expect(data.nonceHex.length).toEqual(16);
        data = data.setSmartContractHash('1220ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
        expect(data.smartContractHash).toEqual(fromHex('1220ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'));
        data = data.setSmartContractMethod('my_method');
        expect(data.smartContractMethod).toEqual('my_method');
        data = data.setSmartContractMethodArgs({ key1: 'val1' });
        expect(data.smartContractMethodArgs).toEqual({ key1: 'val1' });
        expect(data.smartContractMethodArgsBytes).toEqual(fromHex('81a46b657931a476616c31'));
        expect(data.smartContractMethodArgsHex).toEqual('81a46b657931a476616c31');
        expect(data.smartContractMethodArgsJson).toEqual('{"key1":"val1"}');
        data = data.setSmartContractMethodArgsJson('{"key2":"val2"}');
        expect(data.smartContractMethodArgs).toEqual({ key2: 'val2' });
        data = data.setSmartContractMethodArgsHex('81a46b657933a476616c33');
        expect(data.smartContractMethodArgs).toEqual({ key3: 'val3' });
        data = data.setSmartContractMethodArgsBytes(fromHex('81a46b657934a476616c34'));
        expect(data.smartContractMethodArgs).toEqual({ key4: 'val4' });
        data = data.setDependsOn('1220ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
        expect(data.dependsOn).toEqual(new Uint8Array([
            18, 32, 255, 255, 255, 255, 255,
            255, 255, 255, 255, 255, 255, 255,
            255, 255, 255, 255, 255, 255, 255,
            255, 255, 255, 255, 255, 255, 255,
            255, 255, 255, 255, 255, 255,
        ]));
        const keyPair = new ECDSAKeyPair();
        await keyPair.generate();
        data = data.setSignerPublicKey(keyPair.publicKey);
        expect(data.signerPublicKey).toEqual(keyPair.publicKey);
    });
});
