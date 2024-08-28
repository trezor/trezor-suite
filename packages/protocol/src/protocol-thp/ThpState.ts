import {
    ThpCredentialResponse,
    ThpDeviceProperties,
    ThpHandshakeCredentials,
    ThpMessageSyncBit,
    ThpPairingMethod,
} from './messages';

// public state values
export type ThpStateSerialized = {
    properties?: ThpDeviceProperties;
    channel: string; // 2 bytes as hex
    expectedResponses: number[]; // expected responses from the device
    sendBit: ThpMessageSyncBit; // host synchronization bit
    recvBit: ThpMessageSyncBit; // device synchronization bit
    sendNonce: number; // host nonce
    recvNonce: number; // device nonce
};

export type ThpPhase = 'hh0' | 'hh1' | 'hh2' | 'hh3';

export class ThpState {
    private _properties?: ThpDeviceProperties;
    private _phase: ThpPhase = 'hh0';
    private _isPaired: boolean = false;
    // private _properties?: ThpDeviceProperties;
    private _handshakeCredentials?: ThpHandshakeCredentials;
    // private _pairingCredentials?: Buffer;
    private _channel: Buffer = Buffer.alloc(0);
    private _sendBit: ThpMessageSyncBit = 0;
    private _sendNonce: number = 0;
    private _recvBit: ThpMessageSyncBit = 0;
    private _recvNonce: number = 1;
    private _sessionId: Uint8Array = new Uint8Array(1);
    private _expectedResponses: number[] = [];
    private _selectedMethod?: ThpPairingMethod;
    private _pairingCredentials?: ThpCredentialResponse & { autoconnect?: boolean }; // TODO: type
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
        return this._isPaired && this._pairingCredentials?.autoconnect;
    }

    setIsPaired(val: boolean) {
        this._isPaired = val;
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

    updateSyncBit(type: 'send' | 'recv', syncBit?: ThpMessageSyncBit) {
        const calc = (curr: ThpMessageSyncBit, v?: ThpMessageSyncBit) => {
            if (typeof v === 'number') {
                return v;
            }

            return curr > 0 ? 0 : 1;
        };
        if (type === 'send') {
            // this._sendBit = syncBit ?? this._sendBit > 0 ? 0 : 1;
            this._sendBit = calc(this._sendBit, syncBit);
        } else {
            // this._recvBit = syncBit ?? this._recvBit > 0 ? 0 : 1;
            this._recvBit = calc(this._recvBit, syncBit);
        }

        console.warn('Update sync bit', 'send', this._sendBit, 'recv', this._recvBit);
    }

    // TODO: make sure that its update correctly (transport .call, read, write)
    updateNonce(type: 'send' | 'recv', nonce?: number) {
        if (type === 'send') {
            this._sendNonce = nonce ?? this._sendNonce + 1;
        } else {
            this._recvNonce = nonce ?? this._recvNonce + 1;
        }

        console.warn('Update nonce', 'send', this._sendNonce, 'recv', this._recvNonce);
    }

    setPairingMethod(method: ThpPairingMethod) {
        this._selectedMethod = method;
    }

    get pairingMethod() {
        return this._selectedMethod;
    }

    setPairingCredentials(credentials: ThpCredentialResponse) {
        this._pairingCredentials = credentials;
    }

    get pairingCredentials() {
        return this._pairingCredentials;
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
            expectedResponses: this.expectedResponses,
            sendBit: this.sendBit,
            recvBit: this.recvBit,
            sendNonce: this.sendNonce,
            recvNonce: this.recvNonce,
        };
    }

    deserialize(json: ReturnType<(typeof this)['serialize']>) {
        if (!json || typeof json !== 'object') {
            throw new Error('ThpState.deserialize empty state');
        }
        [json.sendBit, json.recvBit, json.sendNonce, json.recvNonce].forEach(nr => {
            if (typeof nr !== 'number') {
                throw new Error('ThpState.deserialize invalid state');
            }
        });

        this.setChannel(Buffer.from(json.channel, 'hex'));
        this.setExpectedResponse(json.expectedResponses);
        this.updateSyncBit('send', json.sendBit);
        this.updateSyncBit('recv', json.recvBit);
        this.updateNonce('send', json.sendNonce);
        this.updateNonce('recv', json.recvNonce);
    }

    setExpectedResponse(ex: number[]) {
        this._expectedResponses = ex;
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

    // used in bridge transport
    updateState(messageName: string) {
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
        } else {
            this._sendNonce += 1;
            this._recvNonce += 1;
        }

        if (messageName !== 'ThpCreateChannelResponse') {
            this._sendBit = this._sendBit > 0 ? 0 : 1;
            this._recvBit = this._recvBit > 0 ? 0 : 1;
        }
    }

    resetState() {
        this._phase = 'hh0';
        this._isPaired = false;
        this._handshakeCredentials = undefined;
        this._channel = Buffer.alloc(0);
        this._sendBit = 0;
        this._sendNonce = 0;
        this._recvBit = 0;
        this._recvNonce = 1;
        this._sessionId = new Uint8Array(1);
        this._expectedResponses = [];
        this._selectedMethod = undefined;
        this._pairingCredentials = undefined;
        this._nfcSecret = undefined;
    }

    toString() {
        return JSON.stringify(this.serialize());
    }
}
