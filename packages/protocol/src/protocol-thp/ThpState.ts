import {
    type ThpCredentials,
    type ThpDeviceProperties,
    type ThpHandshakeCredentials,
    type ThpMessageSyncBit,
    ThpPairingMethod,
} from './messages';

export type ThpStateSerialized = {
    properties?: ThpDeviceProperties;
    credentials: ThpCredentials[];
} & ThpChannelState;

export type ThpChannelState = {
    channel: string; // 2 bytes as hex
    sendBit: ThpMessageSyncBit; // host synchronization bit
    recvBit: ThpMessageSyncBit; // device synchronization bit
    sendAckBit: ThpMessageSyncBit; // host ack bit
    recvAckBit: ThpMessageSyncBit; // device ack bit
    sendNonce: number; // host nonce
    recvNonce: number; // device nonce
    expectedResponses: number[]; // expected responses from the device
    recentMessage: string;
};

export type ThpPhase = 'handshake' | 'pairing' | 'paired';

export class ThpState {
    private _properties?: ThpDeviceProperties;
    private _pairingCredentials: ThpCredentials[] = [];
    private _phase: ThpPhase = 'handshake';
    private _isPaired: boolean = false;
    private _pairingTagPromise: { abort: () => Promise<void> } | undefined;
    private _cancelablePromise: boolean = false;
    private _handshakeCredentials?: ThpHandshakeCredentials;
    private _channel: Buffer = Buffer.alloc(0);
    private _sendBit: ThpMessageSyncBit = 0;
    private _sendAckBit: ThpMessageSyncBit = 0;
    private _sendNonce: number = 0;
    private _recvBit: ThpMessageSyncBit = 0;
    private _recvAckBit: ThpMessageSyncBit = 0;
    private _recvNonce: number = 1;
    private _expectedResponses: number[] = [];
    private _selectedMethod?: ThpPairingMethod;
    private _nfcSecret?: Buffer;
    private _sessionId: Buffer = Buffer.alloc(1);
    private _sessionIdCounter: number = 0;
    private _recentMessage: Buffer = Buffer.alloc(0);

    get recentMessage() {
        return this._recentMessage;
    }

    setRecentMessage(msg: Buffer) {
        this._recentMessage = msg;
    }

    get pairingTagPromise() {
        return this._pairingTagPromise;
    }

    setPairingTagPromise(p?: { abort: () => Promise<void> }) {
        this._pairingTagPromise = p;
    }

    get cancelablePromise() {
        return this._cancelablePromise;
    }

    setCancelablePromise(p: boolean) {
        this._cancelablePromise = p;
    }

    get properties() {
        return this._properties;
    }

    setThpProperties(props: ThpDeviceProperties) {
        this._properties = props;
    }

    get phase() {
        return this._phase;
    }

    setPhase(phase: ThpPhase) {
        this._phase = phase;
    }

    get isPaired() {
        return this._isPaired;
    }

    get isAutoconnectPaired() {
        return this._isPaired && this._pairingCredentials[0]?.autoconnect;
    }

    setIsPaired(isPaired: boolean) {
        this._isPaired = isPaired;
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

    removePairingCredential({ credential }: ThpCredentials) {
        const index = this._pairingCredentials.findIndex(c => c.credential === credential);
        if (index >= 0) this._pairingCredentials.splice(index, 1);
    }

    setNfcSecret(secret: Buffer) {
        this._nfcSecret = secret;
    }

    get nfcSecret() {
        return this._nfcSecret;
    }

    get nfcData() {
        if (this._selectedMethod === ThpPairingMethod.NFC && this._nfcSecret) {
            return Buffer.concat([
                this._nfcSecret,
                this.handshakeCredentials!.handshakeHash.subarray(0, 16),
            ]);
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

    get sendAckBit() {
        return this._sendAckBit;
    }

    get sendNonce() {
        return this._sendNonce;
    }

    get recvBit() {
        return this._recvBit;
    }

    get recvAckBit() {
        return this._recvAckBit;
    }

    get recvNonce() {
        return this._recvNonce;
    }

    updateAckBit(type: 'send' | 'recv') {
        if (type === 'send') {
            this._sendAckBit = this._sendAckBit > 0 ? 0 : 1;
        } else {
            this._recvAckBit = this._recvAckBit > 0 ? 0 : 1;
        }
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
        // check if syncBit should be updated
        const updateSyncBit = !['ThpCreateChannelRequest', 'ThpCreateChannelResponse'].includes(
            messageType,
        );
        if (updateSyncBit) {
            this.updateAckBit(type);
            this.updateSyncBit(type);
        }

        // check if nonce should be updated
        const updateNonce =
            updateSyncBit &&
            ![
                'ThpHandshakeInitRequest',
                'ThpHandshakeInitResponse',
                'ThpHandshakeCompletionRequest',
                'ThpHandshakeCompletionResponse',
            ].includes(messageType);
        if (updateNonce) {
            this.updateNonce(type);
        }
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

    get sessionId() {
        return this._sessionId;
    }

    createNewSessionId() {
        this._sessionIdCounter++;
        if (this._sessionIdCounter > 255) {
            this._sessionIdCounter = 1;
        }

        const sessionId = Buffer.alloc(1);
        sessionId.writeUint8(this._sessionIdCounter, 0);

        this.setSessionId(sessionId);

        return sessionId;
    }

    setSessionId(sessionId: Buffer) {
        this._sessionId = sessionId;
    }

    serialize(): ThpStateSerialized {
        return {
            properties: this._properties,
            channel: this.channel.toString('hex'),
            sendBit: this.sendBit,
            recvBit: this.recvBit,
            sendAckBit: this.sendAckBit,
            recvAckBit: this.recvAckBit,
            sendNonce: this.sendNonce,
            recvNonce: this.recvNonce,
            expectedResponses: this._expectedResponses.slice(0),
            credentials: this._pairingCredentials.slice(0),
            recentMessage: this._recentMessage.toString('hex'),
        };
    }

    deserialize(json: ThpChannelState) {
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
        if (typeof json.recentMessage !== 'string') {
            throw error;
        }
        [
            json.sendBit,
            json.recvBit,
            json.sendAckBit,
            json.recvAckBit,
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
        this._sendAckBit = json.sendAckBit;
        this._recvAckBit = json.recvAckBit;
        this._sendNonce = json.sendNonce;
        this._recvNonce = json.recvNonce;
        this._recentMessage = Buffer.from(json.recentMessage, 'hex');
    }

    get expectedResponses() {
        return this._expectedResponses;
    }

    setExpectedResponses(expected: number[]) {
        this._expectedResponses = expected;
    }

    resetState() {
        this._phase = 'handshake';
        this._isPaired = false;
        this._pairingTagPromise = undefined;
        this._cancelablePromise = false;
        this._handshakeCredentials = undefined;
        this._channel = Buffer.alloc(0);
        this._sendBit = 0;
        this._sendAckBit = 0;
        this._sendNonce = 0;
        this._recvBit = 0;
        this._recvAckBit = 0;
        this._recvNonce = 1;
        this._expectedResponses = [];
        this._pairingCredentials = [];
        this._selectedMethod = undefined;
        this._nfcSecret = undefined;
        this._sessionId = Buffer.alloc(1);
        this._sessionIdCounter = 0;
    }

    toString() {
        return JSON.stringify(this.serialize());
    }
}
