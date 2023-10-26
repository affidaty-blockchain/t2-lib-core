import { toHex, fromHex } from './binConversions';
import { bytesToObject, objectToBytes } from './utils';
import { IBaseTxUnnamedObject } from './transaction/baseTransaction';

export namespace MessageTypes {
    export const Undefined = -1;
    export const Exception = 0;
    export const Subscribe = 1;
    export const Unsubscribe = 2;
    export const PutTransactionRequest = 3;
    export const PutTransactionResponse = 4;
    export const GetTransactionRequest = 5;
    export const GetTransactionResponse = 6;
    export const GetReceiptRequest = 7;
    export const GetReceiptResponse = 8;
    export const GetBlockRequest = 9;
    export const GetBlockResponse = 10;
    export const GetAccountRequest = 11;
    export const GetAccountResponse = 12;
    export const GetCoreStatsRequest = 13;
    export const GetCoreStatsResponse = 14;
    export const TransactionEvent = 15;
    export const GetNetworkIdRequest = 16;
    export const GetNetworkIdResponse = 17;
    // export const GetSeedRequest = 18;
    // export const GetSeedResponse = 19;
    // export const GetP2PIdRequest = 20;
    // export const GetP2PIdResponse = 21;
    export const Stop = 254;
    export const Packed = 255;
}

interface IMessagesSettings {
    [key: number]: {
        name: string;
        bodyOrder: string[];
    };
}

const MsgStructs: IMessagesSettings = {
    [MessageTypes.Undefined]: {
        name: 'Undefined',
        bodyOrder: [],
    },
    [MessageTypes.Exception]: {
        name: 'Exception',
        bodyOrder: ['type', 'source'],
    },
    [MessageTypes.Subscribe]: {
        name: 'Subscribe',
        bodyOrder: ['id', 'events'],
    },
    [MessageTypes.Unsubscribe]: {
        name: 'Unsubscribe',
        bodyOrder: ['id', 'events'],
    },
    [MessageTypes.PutTransactionRequest]: {
        name: 'PutTransaction request',
        bodyOrder: ['confirmed', 'tx'],
    },
    [MessageTypes.PutTransactionResponse]: {
        name: 'PutTransaction response',
        bodyOrder: ['ticket'],
    },
    [MessageTypes.GetTransactionRequest]: {
        name: 'GetTransactions request',
        bodyOrder: ['ticket', 'destination'],
    },
    [MessageTypes.GetTransactionResponse]: {
        name: 'GetTransaction response',
        bodyOrder: ['tx', 'origin'],
    },
    [MessageTypes.GetReceiptRequest]: {
        name: 'GetReceipt request',
        bodyOrder: ['ticket'],
    },
    [MessageTypes.GetReceiptResponse]: {
        name: 'GetReceipt response',
        bodyOrder: ['receipt'],
    },
    [MessageTypes.GetBlockRequest]: {
        name: 'GetBlock request',
        bodyOrder: ['height', 'showTickets', 'destination'],
    },
    [MessageTypes.GetBlockResponse]: {
        name: 'GetBlock response',
        bodyOrder: ['blockInfo', 'ticketList', 'origin'],
    },
    [MessageTypes.GetAccountRequest]: {
        name: 'GetAccount request',
        bodyOrder: ['accountId', 'keys'],
    },
    [MessageTypes.GetAccountResponse]: {
        name: 'GetAccount response',
        bodyOrder: ['accountInfo', 'data'],
    },
    [MessageTypes.TransactionEvent]: {
        name: 'SmartContract event',
        bodyOrder: ['eventDataArray'],
    },
    [MessageTypes.Stop]: {
        name: 'Stop',
        bodyOrder: [],
    },
    [MessageTypes.Packed]: {
        name: 'Packed',
        bodyOrder: ['packedMessages'],
    },
};

interface TMessageArray extends Array<any> {
    [0]: string;
    [key: number]: any;
}

interface IInternalBody {
    [key: string]: any;
}

/**
 * Trinci Message class for messagges import/export and transcoding.
 * Trinci nodes communicate using serialized messages.
 */
export class TrinciMessage {
    private msgTypeValue: number = MessageTypes.Undefined;

    private _body: IInternalBody = {};

    private bodyOrder: string[] = [];

    constructor(msgType: number = MessageTypes.Undefined, msgBody: IInternalBody = {}) {
        this.msgTypeValue = msgType;
        this.bodyOrder = MsgStructs[this.msgTypeValue].bodyOrder;
        this._body = msgBody;
    }

    get type(): number {
        return this.msgTypeValue;
    }

    get typeName(): string {
        return MsgStructs[this.msgTypeValue].name;
    }

    get body(): IInternalBody {
        return this._body;
    }

    assertType(expectedType: number): void {
        if (this.type === MessageTypes.Exception) {
            throw new Error(
                `Exception message received from blockchain. Type: ${this.body.type}; Source: ${this.body.source}`,
            );
        }
        if (this.type !== expectedType) {
            throw new Error(
                `Wrong message type received: ${this.type}; Expected: ${expectedType}`,
            );
        }
    }

    buildMessageArray(): TMessageArray {
        const messageArray: TMessageArray = [this.msgTypeValue.toString()];
        this.bodyOrder.forEach((bodyMemberKey) => {
            if (typeof this._body[bodyMemberKey] === 'undefined') {
                throw new Error(`Member '${bodyMemberKey}' undefined.`);
            }
            messageArray.push(this._body[bodyMemberKey]);
        });
        return messageArray;
    }

    public toBytes(): Uint8Array {
        if (this.msgTypeValue === MessageTypes.Undefined) {
            throw new Error('Cannot pack an undefined message');
        }
        const messageArray: TMessageArray = this.buildMessageArray();
        return objectToBytes(messageArray);
    }

    public fromBytes(messageBytes: Uint8Array): void {
        const messageArray: TMessageArray = bytesToObject(messageBytes);
        if (
            // TODO: change this as soon as core changes message type to number
            typeof messageArray[0] !== 'string'
            || typeof MsgStructs[parseInt(messageArray[0], 10)] === 'undefined'
        ) {
            throw new Error(`Unknown message type. Bytes received: ${toHex(messageBytes)}`);
        }
        this.msgTypeValue = parseInt(messageArray[0], 10);
        this.bodyOrder = MsgStructs[this.msgTypeValue].bodyOrder;
        if (
            messageArray.length !== (MsgStructs[this.msgTypeValue].bodyOrder.length + 1)
        ) {
            throw new Error(`Unknown message type. Bytes received: ${toHex(messageBytes)}`);
        }
        // starting from the second element as the first is the message type identifier
        for (let i = 1; i < messageArray.length; i += 1) {
            this._body[this.bodyOrder[i - 1]] = messageArray[i];
        }
    }
}

export type TSubscribeEventType = 'transaction' | 'blockCreated' | 'gossipRequest' | 'contractEvents' | 'unicastRequest' | 'block';

const allEventsList: TSubscribeEventType[] = [
    'transaction',
    'blockCreated',
    'gossipRequest',
    'contractEvents',
    'unicastRequest',
    'block',
];

function bitFlagConversion<T>(selectedList: T[], allList: T[]): number {
    let bitFlags: number = 0;
    for (let i = 0; i < selectedList.length; i += 1) {
        const idx = allList.indexOf(selectedList[i]);
        if (idx < 0) {
            throw new Error('Unknown value.');
        } else {
            /* eslint-disable-next-line no-bitwise */
            bitFlags |= 1 << idx;
        }
    }
    return bitFlags;
}

/** Standard Trinci messagges */
export namespace stdTrinciMessages {
    export function subscribe(
        id: string,
        events: TSubscribeEventType[],
    ): TrinciMessage {
        return new TrinciMessage(MessageTypes.Subscribe, {
            id,
            events: bitFlagConversion(events, allEventsList),
        });
    }

    export function unsubscribe(
        id: string,
        events: TSubscribeEventType[],
    ): TrinciMessage {
        return new TrinciMessage(MessageTypes.Unsubscribe, {
            id,
            events: bitFlagConversion(events, allEventsList),
        });
    }

    export function submitTransaction(
        confirmed: boolean,
        TxObj: IBaseTxUnnamedObject,
    ): TrinciMessage {
        return new TrinciMessage(MessageTypes.PutTransactionRequest, {
            confirmed,
            tx: TxObj,
        });
    }

    export function getTransaction(
        ticket: string,
    ): TrinciMessage {
        const binTicket = fromHex(ticket);
        return new TrinciMessage(MessageTypes.GetTransactionRequest, {
            ticket: binTicket,
            destination: null,
        });
    }

    export function getReceipt(
        ticket: string,
    ): TrinciMessage {
        const binTicket = fromHex(ticket);
        return new TrinciMessage(MessageTypes.GetReceiptRequest, {
            ticket: binTicket,
        });
    }

    export function getBlock(height: number | string, showTxs: boolean = true): TrinciMessage {
        let _height: BigInt = BigInt(0);
        if (typeof height === 'number') {
            _height = BigInt(Math.abs(Math.trunc(height)));
        } else if (height.startsWith('0x')) {
            _height = BigInt(height);
        } else {
            _height = BigInt(`0x${height}`);
        }
        return new TrinciMessage(MessageTypes.GetBlockRequest, {
            height: _height,
            showTickets: showTxs,
            destination: null,
        });
    }

    export function getAccount(accountId: string, keys: string[] = []): TrinciMessage {
        return new TrinciMessage(MessageTypes.GetAccountRequest, {
            accountId,
            keys,
        });
    }

    /**
     * @param emitterTx - emitter transaction ticket(hex string)
     * @param emitterAccount - emitter account
     * @param emitterContract - emitter smart contract hash (hex string)
     * @param eventName - name of the emitter event
     * @param eventData - data emitted with the event
     */
    export function txEvent(
        emitterTx: string,
        emitterAccount: string,
        emitterContract: string,
        eventName: string,
        eventData: Uint8Array,
    ): TrinciMessage {
        return new TrinciMessage(MessageTypes.TransactionEvent, {
            eventDataArray: [
                fromHex(emitterTx),
                emitterAccount,
                fromHex(emitterContract),
                eventName,
                eventData,
            ],
        });
    }

    export function packed(messages: TrinciMessage[]): TrinciMessage {
        const messageList: TMessageArray[] = [];
        messages.forEach((message: TrinciMessage) => {
            messageList.push(message.buildMessageArray());
        });
        return new TrinciMessage(MessageTypes.Packed, {
            packedMessages: objectToBytes(messageList),
        });
    }

    export function stop(): TrinciMessage {
        return new TrinciMessage(MessageTypes.Stop);
    }
}
