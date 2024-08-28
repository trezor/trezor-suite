import {
    ThpCredentials,
    ThpDeviceProperties,
    ThpHandshakeCredentials,
    ThpMessageSyncBit,
    ThpPairingMethod,
} from './messages';

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

export type ThpPhase = 'handshake' | 'pairing' | 'paired';

export class ThpState {
    private _properties?: ThpDeviceProperties;
    private _pairingCredentials: ThpCredentials[] = [];
    private _phase: ThpPhase = 'handshake';
    private _isPaired: boolean = false;
    private _handshakeCredentials?: ThpHandshakeCredentials;
    private _channel: Buffer = Buffer.alloc(0);
    private _sendBit: ThpMessageSyncBit = 0;
    private _sendNonce: number = 0;
    private _recvBit: ThpMessageSyncBit = 0;
    private _recvNonce: number = 1;
    private _expectedResponses: number[] = [];
    private _sessionId: Uint8Array = new Uint8Array(1);
    private _selectedMethod?: ThpPairingMethod;
    private _nfcSecret?: Buffer;

    get properties() {
        return this._properties;
    }

    setThpProperties(props: ThpDeviceProperties) {
        this._properties = props;
    }

    get phase() {
        return this._phase;
    }

    setPhase(p: ThpPhase) {
        this._phase = p;
    }

    get isPaired() {
        return this._isPaired;
    }

    get isAutoconnectPaired() {
        return this._isPaired && this._pairingCredentials[0]?.autoconnect;
    }

    setIsPaired(val: boolean) {
        this._isPaired = val;
    }

    get pairingMethod() {
        return this._selectedMethod;
    }

    setPairingMethod(method: ThpPairingMethod) {
        this._selectedMethod = method;
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

    setNfcSecret(secret: Buffer) {
        this._nfcSecret = secret;
    }

    get nfcSecret() {
        return this._nfcSecret;
    }

    get nfcData() {
        if (this._selectedMethod === ThpPairingMethod.NFC && this._nfcSecret) {
            const h = this.handshakeCredentials?.handshakeHash.subarray(0, 16);

            // @ts-expect-error
            return Buffer.concat([this._nfcSecret, h]);
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

    sync(type: 'send' | 'recv', messageType: string) {
        const syncBit = !['ThpCreateChannelRequest', 'ThpCreateChannelResponse'].includes(
            messageType,
        );
        if (syncBit) {
            this.updateSyncBit(type);
        }

        const nonce =
            syncBit &&
            ![
                'ThpHandshakeInitRequest',
                'ThpHandshakeInitResponse',
                'ThpHandshakeCompletionRequest',
                'ThpHandshakeCompletionResponse',
            ].includes(messageType);
        if (nonce) {
            this.updateNonce(type);
        }
    }

    get sessionId() {
        return this._sessionId;
    }

    setSessionId(sessionId: Uint8Array) {
        this._sessionId = sessionId;
    }

    get handshakeCredentials() {
        return this._handshakeCredentials;
    }

    updateHandshakeCredentials(newCredentials: Partial<ThpHandshakeCredentials>) {
        if (!this._handshakeCredentials) {
            this._handshakeCredentials = {
                pairingMethods: [],
                handshakeHash: Buffer.alloc(0),
                handshakeCommitment: Buffer.alloc(0),
                codeEntryChallenge: Buffer.alloc(0),
                trezorEncryptedStaticPubkey: Buffer.alloc(0),
                hostEncryptedStaticPubkey: Buffer.alloc(0),
                staticKey: Buffer.alloc(0),
                hostStaticPublicKey: Buffer.alloc(0),
                hostKey: Buffer.alloc(0),
                trezorKey: Buffer.alloc(0),
                trezorCpacePublicKey: Buffer.alloc(0),
            };
        }

        this._handshakeCredentials = {
            ...this._handshakeCredentials,
            ...newCredentials,
        };
    }

    serialize(): ThpStateSerialized {
        return {
            properties: this._properties,
            channel: this.channel.toString('hex'),
            sendBit: this.sendBit,
            recvBit: this.recvBit,
            sendNonce: this.sendNonce,
            recvNonce: this.recvNonce,
            expectedResponses: this._expectedResponses.slice(0),
            credentials: this._pairingCredentials.slice(0),
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

    shouldUpdateNonce(messageName: string) {
        if (
            [
                'ThpCreateChannelRequest',
                'ThpCreateChannelResponse',
                'ThpHandshakeInitRequest',
                'ThpHandshakeInitResponse',
                'ThpHandshakeCompletionRequest',
                'ThpHandshakeCompletionResponse',
            ].includes(messageName)
        ) {
            // keep nonce at initial values for first three messages of the handshake workflow
            this._sendNonce = 0;
            this._recvNonce = 1;

            return false;
        }

        return true;
    }

    setExpectedResponses(expected: number[]) {
        this._expectedResponses = expected;
    }

    resetState() {
        this._phase = 'handshake';
        this._isPaired = false;
        this._handshakeCredentials = undefined;
        this._channel = Buffer.alloc(0);
        this._sendBit = 0;
        this._sendNonce = 0;
        this._recvBit = 0;
        this._recvNonce = 1;
        this._expectedResponses = [];
        this._pairingCredentials = [];
        this._sessionId = new Uint8Array(1);
        this._expectedResponses = [];
        this._selectedMethod = undefined;
        this._nfcSecret = undefined;
    }

    toString() {
        return JSON.stringify(this.serialize());
    }
}
