import { ThpCredentials, ThpDeviceProperties, ThpMessageSyncBit } from './messages';

export type ThpStateSerialized = {
    properties?: ThpDeviceProperties;
    credentials: ThpCredentials[];
    channel: string; // 2 bytes as hex
    sendBit: ThpMessageSyncBit; // host synchronization bit
    recvBit: ThpMessageSyncBit; // device synchronization bit
    sendNonce: number; // host nonce
    recvNonce: number; // device nonce
    expectedResponses: number[]; // expected responses from the device
};

export class ThpState {
    private _properties?: ThpDeviceProperties;
    private _pairingCredentials: ThpCredentials[] = [];
    private _channel: Buffer = Buffer.alloc(0);
    private _sendBit: ThpMessageSyncBit = 0;
    private _sendNonce: number = 0;
    private _recvBit: ThpMessageSyncBit = 0;
    private _recvNonce: number = 1;
    private _expectedResponses: number[] = [];

    get properties() {
        return this._properties;
    }

    setThpProperties(props: ThpDeviceProperties) {
        this._properties = props;
    }

    get pairingCredentials() {
        return this._pairingCredentials;
    }

    setPairingCredentials(credentials?: ThpCredentials[]) {
        if (credentials) {
            this._pairingCredentials.push(...credentials);
        } else {
            this._pairingCredentials = [];
        }
    }

    get channel() {
        return this._channel;
    }

    setChannel(channel: Buffer) {
        this._channel = channel;
    }

    get sendBit() {
        return this._sendBit;
    }

    get sendNonce() {
        return this._sendNonce;
    }

    get recvBit() {
        return this._recvBit;
    }

    get recvNonce() {
        return this._recvNonce;
    }

    updateSyncBit(type: 'send' | 'recv') {
        if (type === 'send') {
            this._sendBit = this._sendBit > 0 ? 0 : 1;
        } else {
            this._recvBit = this._recvBit > 0 ? 0 : 1;
        }
    }

    updateNonce(type: 'send' | 'recv') {
        if (type === 'send') {
            this._sendNonce += 1;
        } else {
            this._recvNonce += 1;
        }
    }

    serialize(): ThpStateSerialized {
        return {
            properties: this._properties,
            channel: this.channel.toString('hex'),
            sendBit: this.sendBit,
            recvBit: this.recvBit,
            sendNonce: this.sendNonce,
            recvNonce: this.recvNonce,
            expectedResponses: this._expectedResponses,
            credentials: this._pairingCredentials,
        };
    }

    deserialize(json: ReturnType<(typeof this)['serialize']>) {
        // simple fields validation
        const error = new Error('ThpState.deserialize invalid state');
        if (!json || typeof json !== 'object') {
            throw error;
        }
        if (!Array.isArray(json.expectedResponses)) {
            throw error;
        }
        if (typeof json.channel !== 'string') {
            throw error;
        }
        [
            json.sendBit,
            json.recvBit,
            json.sendNonce,
            json.recvNonce,
            ...json.expectedResponses,
        ].forEach(nr => {
            if (typeof nr !== 'number') {
                throw error;
            }
        });

        this._channel = Buffer.from(json.channel, 'hex');
        this._expectedResponses = json.expectedResponses;
        this._sendBit = json.sendBit;
        this._recvBit = json.recvBit;
        this._sendNonce = json.sendNonce;
        this._recvNonce = json.recvNonce;
    }

    get expectedResponses() {
        return this._expectedResponses;
    }

    setExpectedResponses(expected: number[]) {
        this._expectedResponses = expected;
    }

    resetState() {
        this._channel = Buffer.alloc(0);
        this._sendBit = 0;
        this._sendNonce = 0;
        this._recvBit = 0;
        this._recvNonce = 1;
        this._expectedResponses = [];
        this._pairingCredentials = [];
    }

    toString() {
        return JSON.stringify(this.serialize());
    }
}
