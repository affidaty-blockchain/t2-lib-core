import { fromHex } from '../../src/binConversions';
import { Account } from '../../src/account';
import { BulkRootTransaction } from '../../src/transaction/bulkRootTransaction';
import { BulkNodeTransaction } from '../../src/transaction/bulkNodeTransaction';
import { BulkTransaction } from '../../src/transaction/bulkTransaction';

const rootSigner = new Account();
const nodeSigner = new Account();
let rootTx = new BulkRootTransaction();
let nodeTx1 = new BulkNodeTransaction();
let nodeTx2 = new BulkNodeTransaction();
let expectedRootTicket = '';
let expectedNode1Ticket = '';
let expectedNode2Ticket = '';
let expectedBulkTicket = '';

describe('preliminary ops', () => {
    test('keys generation', async () => {
        await rootSigner.generate();
        await nodeSigner.generate();
    });
    test('bulk and node transactions creation', async () => {
        rootTx = rootTx
            .setTarget('#root_target')
            .setMaxFuel(10000)
            .setNetworkName('my_network')
            .setNonce('0000000000000000')
            .setSmartContractHash('1220ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
            .setSmartContractMethod('my_method')
            .setSmartContractMethodArgs({ answer: 42 })
            .setSignerPublicKey(rootSigner.keyPair.publicKey);
        nodeTx1 = nodeTx1
            .setTarget('#node_1_target')
            .setMaxFuel(10000)
            .setNetworkName('my_network')
            .setNonce('0101010101010101')
            .setSmartContractHash('1220ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
            .setSmartContractMethod('my_method')
            .setSmartContractMethodArgs({ answer: 42 })
            .setDependsOn(await rootTx.getTicket());
        await nodeTx1.sign(nodeSigner.keyPair.privateKey);
        nodeTx2 = nodeTx2
            .setTarget('#node_2_target')
            .setMaxFuel(10000)
            .setNetworkName('my_network')
            .setNonce('0202020202020202')
            .setSmartContractHash('1220ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
            .setSmartContractMethod('my_method')
            .setSmartContractMethodArgs({ answer: 42 })
            .setDependsOn(await rootTx.getTicket());
        await nodeTx2.sign(nodeSigner.keyPair.privateKey);
        expectedRootTicket = await rootTx.getTicket();
        expectedNode1Ticket = await nodeTx1.getTicket();
        expectedNode2Ticket = await nodeTx2.getTicket();
    });
});

describe('BulkTransaction', () => {
    test('fields exceptions', async () => {
        const bulkTx = new BulkTransaction();
        expect(() => { bulkTx.target = '#trg'; }).toThrow();
        expect(() => { return bulkTx.target; }).toThrow();
        expect(() => { bulkTx.setTarget('#trg'); }).toThrow();
        expect(() => { bulkTx.maxFuel = 10; }).toThrow();
        expect(() => { return bulkTx.maxFuel; }).toThrow();
        expect(() => { bulkTx.setMaxFuel(10); }).toThrow();
        expect(() => { bulkTx.networkName = 'netw'; }).toThrow();
        expect(() => { return bulkTx.networkName; }).toThrow();
        expect(() => { bulkTx.setNetworkName('net'); }).toThrow();
        expect(() => { bulkTx.nonce = fromHex('ff00ff00ff00ff00'); }).toThrow();
        expect(() => { return bulkTx.nonce; }).toThrow();
        expect(() => { bulkTx.nonceHex = 'ff00ff00ff00ff00'; }).toThrow();
        expect(() => { return bulkTx.nonceHex; }).toThrow();
        expect(() => { bulkTx.setNonce('ff00ff00ff00ff00'); }).toThrow();
        expect(() => { bulkTx.smartContractHashHex = 'ff00ff00ff00ff00'; }).toThrow();
        expect(() => { return bulkTx.smartContractHashHex; }).toThrow();
        expect(() => { bulkTx.setSmartContractHash('ff00ff00ff00ff00'); }).toThrow();
        expect(() => { bulkTx.smartContractMethod = 'my_method'; }).toThrow();
        expect(() => { return bulkTx.smartContractMethod; }).toThrow();
        expect(() => { bulkTx.setSmartContractMethod('my_method'); }).toThrow();
        expect(() => { bulkTx.smartContractMethodArgs = 'str'; }).toThrow();
        expect(() => { return bulkTx.smartContractMethodArgs; }).toThrow();
        expect(() => { bulkTx.setSmartContractMethodArgs('str'); }).toThrow();
        expect(() => { bulkTx.dependsOnHex = '1220ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'; }).toThrow();
        expect(() => { return bulkTx.dependsOnHex; }).toThrow();
        expect(() => { bulkTx.setDependsOn('1220ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'); }).toThrow();
    });
    test('sign/verify', async () => {
        const bulkTx = new BulkTransaction()
            .setRoot(rootTx)
            .addNode(nodeTx1)
            .addNode(nodeTx2);
        await bulkTx.sign(nodeSigner.keyPair.privateKey);
        expect(bulkTx.verify()).rejects.toBeDefined();
        await bulkTx.sign(rootSigner.keyPair.privateKey);
        expect(bulkTx.verify()).resolves.toBeTruthy();
        expectedBulkTicket = await bulkTx.getTicket();
    });
    test('to/from unnamed object', async () => {
        const bulkTx = new BulkTransaction()
            .setRoot(rootTx)
            .addNode(nodeTx1)
            .addNode(nodeTx2);
        await bulkTx.sign(rootSigner.keyPair.privateKey);
        const uObj = await bulkTx.toUnnamedObject();

        const bulkTx2 = new BulkTransaction();
        await bulkTx2.fromUnnamedObject(uObj);
        expect(bulkTx2.verify()).resolves.toBeTruthy();
        expect(bulkTx2.getTicket()).resolves.toEqual(expectedBulkTicket);
        expect(bulkTx2.root.getTicket()).resolves.toEqual(expectedRootTicket);
        expect(bulkTx2.nodes[0].getTicket()).resolves.toEqual(expectedNode1Ticket);
        expect(bulkTx2.nodes[1].getTicket()).resolves.toEqual(expectedNode2Ticket);
    });
    test('to/from object', async () => {
        const bulkTx = new BulkTransaction()
            .setRoot(rootTx)
            .addNode(nodeTx1)
            .addNode(nodeTx2);
        await bulkTx.sign(rootSigner.keyPair.privateKey);
        const obj = await bulkTx.toObject();

        const bulkTx2 = new BulkTransaction();
        await bulkTx2.fromObject(obj);
        expect(bulkTx2.verify()).resolves.toBeTruthy();
        expect(bulkTx2.getTicket()).resolves.toEqual(expectedBulkTicket);
        expect(bulkTx2.root.getTicket()).resolves.toEqual(expectedRootTicket);
        expect(bulkTx2.nodes[0].getTicket()).resolves.toEqual(expectedNode1Ticket);
        expect(bulkTx2.nodes[1].getTicket()).resolves.toEqual(expectedNode2Ticket);
    });
    test('to/from base58', async () => {
        const bulkTx = new BulkTransaction()
            .setRoot(rootTx)
            .addNode(nodeTx1)
            .addNode(nodeTx2);
        await bulkTx.sign(rootSigner.keyPair.privateKey);
        const b58 = await bulkTx.toBase58();

        const bulkTx2 = new BulkTransaction();
        await bulkTx2.fromBase58(b58);
        expect(bulkTx2.verify()).resolves.toBeTruthy();
        expect(bulkTx2.getTicket()).resolves.toEqual(expectedBulkTicket);
        expect(bulkTx2.root.getTicket()).resolves.toEqual(expectedRootTicket);
        expect(bulkTx2.nodes[0].getTicket()).resolves.toEqual(expectedNode1Ticket);
        expect(bulkTx2.nodes[1].getTicket()).resolves.toEqual(expectedNode2Ticket);
    });
});
