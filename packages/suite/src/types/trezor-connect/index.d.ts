declare module 'trezor-connect' {
    // Transaction object
    interface TokenTransfer {
        type: 'sent' | 'recv' | 'self' | 'unknown';
        name: string;
        symbol: string;
        address: string;
        decimals: number;
        amount: string;
        from?: string;
        to?: string;
    }

    // Transaction object
    interface TransactionTarget {
        addresses?: string[];
        isAddress: boolean;
        amount?: string;
        coinbase?: string;
    }

    export interface AccountTransaction {
        type: 'sent' | 'recv' | 'self' | 'unknown';

        txid: string;
        blockTime?: number;
        blockHeight?: number;
        blockHash?: string;

        amount: string;
        fee?: string;
        total?: string; // amount + total

        targets: TransactionTarget[];
        tokens: TokenTransfer[];
        rbf?: boolean;
        ethereumSpecific?: {
            status: number;
            nonce: number;
            gasLimit: number;
            gasUsed?: number;
            gasPrice: string;
        };
    }

    interface TokenInfo {
        type: string; // token type: ERC20...
        address: string; // token address
        balance: string; // token balance
        name: string; // token name
        symbol: string; // token symbol
        decimals: number; //
        // transfers: number, // total transactions?
    }

    interface Address {
        address: string;
        path: string;
        transfers: number;
        balance?: string;
        sent?: string;
        received?: string;
    }

    export interface AccountAddresses {
        change: Address[];
        used: Address[];
        unused: Address[];
    }

    export interface AccountUtxo {
        txid: string;
        vout: number;
        amount: string;
        blockHeight: number;
        address: string;
        path: string;
        confirmations: number;
        coinbase?: boolean;
    }

    export interface AccountInfo {
        empty: boolean;
        path: string;
        descriptor: string; // address or xpub
        balance: string;
        availableBalance: string;
        tokens?: TokenInfo[]; // ethereum tokens
        addresses?: AccountAddresses; // bitcoin addresses
        utxo?: AccountUtxo[]; // bitcoin utxo
        history: {
            total: number; // total transactions (unknown in ripple)
            tokens?: number; // tokens transactions (unknown in ripple)
            unconfirmed?: number; // unconfirmed transactions (unknown in ripple)
            transactions?: AccountTransaction[]; // list of transactions
            txids?: string[]; // not implemented
        };
        misc?: {
            // ETH
            nonce?: string;
            // XRP
            sequence?: number;
            reserve?: string;
        };
        page?: {
            // blockbook
            index: number;
            size: number;
            total: number;
        };
        marker?: {
            // ripple-lib
            ledger: number;
            seq: number;
        };
    }

    export interface AccountInfoRequest {
        coin: string;
        path?: string;
        descriptor?: string;
        details?: 'basic' | 'tokens' | 'tokenBalances' | 'txids' | 'txs';
        tokens?: 'nonzero' | 'used' | 'derived';
        page?: number;
        pageSize?: number;
        from?: number;
        to?: number;
        contractFilter?: string;
        gap?: number;
        marker?: {
            ledger: number;
            seq: number;
        };
    }

    export type DiscoveryAccountType = 'normal' | 'segwit' | 'legacy';

    export interface DiscoveryAccount {
        type: DiscoveryAccountType;
        label: string;
        descriptor: string;
        address_n: number[];
        empty?: boolean;
        balance?: string;
        addresses?: AccountAddresses;
    }

    interface Error {
        success: false;
        payload: { error: string; code?: string };
    }

    interface Success<T> {
        id: number;
        success: true;
        payload: T;
    }

    export type ResponseMessage<T> = Error | Success<T>;

    export interface Message {
        message: string;
    }

    export interface Bundle<T> {
        bundle: T[];
    }

    interface CommonParams {
        device?: {
            path: string;
            state?: string;
            instance?: number;
        };
        useEmptyPassphrase?: boolean;
        allowSeedlessDevice?: boolean;
        keepSession?: boolean;
    }

    export interface GetPublicKeyParams extends CommonParams {
        path: string;
        coin?: string;
        crossChain?: boolean;
    }

    export interface PublicKey {
        path: number[]; // hardended path
        serializedPath: string; // serialized path
        xpub: string; // xpub in legacy format
        xpubSegwit?: string; // optional for segwit accounts: xpub in segwit format
        chainCode: string; // BIP32 serialization format
        childNum: number; // BIP32 serialization format
        publicKey: string; // BIP32 serialization format
        fingerprint: number; // BIP32 serialization format
        depth: number; // BIP32 serialization format
    }

    export interface Features {
        vendor: string;
        major_version: number;
        minor_version: number;
        patch_version: number;
        bootloader_mode: boolean | null;
        device_id: string;
        pin_protection: boolean;
        passphrase_protection: boolean;
        language: string | null;
        label: string | null;
        initialized: true;
        revision: string;
        bootloader_hash: string;
        imported: boolean;
        pin_cached: boolean;
        passphrase_cached: boolean;
        firmware_present: boolean | null;
        needs_backup: false;
        flags: number;
        model: string;
        fw_major: number;
        fw_minor: number;
        fw_patch: number;
        fw_vendor: string;
        fw_vendor_keys: string;
        unfinished_backup: boolean;
        no_backup: boolean;
    }

    interface LoginChallenge {
        challengeHidden: string;
        challengeVisual: string;
    }

    export type RequestLoginParams =
        | CommonParams & { callback: () => LoginChallenge }
        | LoginChallenge;

    export interface LoginDetails {
        address: string;
        publicKey: string;
        signature: string;
    }

    export interface CipherKeyValueParams extends CommonParams {
        path: string | number[];
        key?: string;
        value?: string;
        askOnEncrypt?: boolean;
        askOnDecrypt?: boolean;
        iv?: string;
    }

    export interface CipherKeyValue extends CommonParams {
        value: string;
    }

    export interface ResetDeviceParams extends CommonParams {
        strength?: number;
        label?: string;
        u2fCounter?: number;
        pinProtection?: boolean;
        passphraseProtection?: boolean;
        skipBackup?: boolean;
        noBackup?: boolean;
    }

    export interface GetAddressParams extends CommonParams {
        path: string | number[];
        address?: string;
        showOnTrezor?: boolean;
        coin?: string;
        crossChain?: boolean;
    }

    export interface Address {
        address: string;
        path: number[];
        serializedPath: string;
    }

    export interface ComposeTransactionParams extends CommonParams {
        outputs: Output[];
        coin: string;
        push?: boolean;
    }

    export interface Transaction {
        signatures: string[]; // signer signatures
        serializedTx: string; // serialized transaction
        txid?: string; // blockchain transaction id
    }

    export interface VerifyMessageParams extends CommonParams {
        address: string;
        message: string;
        signature: string;
        coin: string;
    }

    export interface SignMessageParams extends CommonParams {
        path: string | number[];
        message: string;
        coin?: string;
    }

    export interface SignedMessage {
        address: string; // signer address
        signature: string; // signature in base64 format
    }

    export type DeviceStatus = 'available' | 'occupied' | 'used';

    export type DeviceMode = 'normal' | 'bootloader' | 'initialize' | 'seedless';

    export type DeviceFirmwareStatus = 'valid' | 'outdated' | 'required';

    export interface FirmwareRelease {
        required: boolean;
        version: number[];
        min_bridge_version: number[];
        min_firmware_version: number[];
        bootloader_version: number[];
        min_bootloader_version: number[];
        url: string;
        channel: string;
        fingerprint: string;
        changelog: string;
    }

    export type Device =
        | {
              type: 'acquired';
              path: string;
              label: string;
              firmware: DeviceFirmwareStatus;
              firmwareRelease: FirmwareRelease;
              status: DeviceStatus;
              mode: DeviceMode;
              state: string | null;
              features: Features;
          }
        | {
              type: 'unacquired';
              path: string;
              label: string;
          }
        | {
              type: 'unreadable';
              path: string;
              label: string;
          };

    export interface SignedTransaction {
        signatures: string[];
        serializedTx: string;
        txId?: string;
    }

    export interface Settings {
        debug: boolean | { [k: string]: boolean };
        configSrc?: string; // constant
        origin?: string;
        hostLabel?: string;
        hostIcon?: string;
        priority?: number;
        trustedHost?: boolean;
        connectSrc?: string;
        iframeSrc?: string;
        popup?: boolean;
        popupSrc?: string;
        webusbSrc?: string;
        transportReconnect?: boolean;
        webusb?: boolean;
        pendingTransportEvent?: boolean;
        supportedBrowser?: boolean;
        extension?: string;
        lazyLoad?: boolean;
        manifest: {
            appUrl: string;
            email: string;
        };
        env?: string;
    }

    export interface Input {
        address_n: number[];
        prev_index: number;
        prev_hash: string;
        amount: string;
        script_type: string;
    }

    export interface RegularOutput {
        address: string;
        amount: string;
        script_type?: string;
    }

    export interface InternalOutput {
        address_n: number[];
        amount: string;
        script_type?: string;
    }

    export interface SendMaxOutput {
        type: 'send-max';
        address: string;
    }

    export interface OpReturnOutput {
        type: 'opreturn';
        dataHex: string;
    }

    export type Output = RegularOutput | InternalOutput | SendMaxOutput | OpReturnOutput;

    export interface BinOutput {
        amount: number;
        script_pubkey: string;
    }

    export interface RefTransaction {
        hash: string;
        version?: number;
        inputs: Input[];
        bin_outputs: BinOutput[];
        lock_time?: number;
        extra_data?: string;
        timestamp?: number;
        version_group_id?: number;
    }

    export interface SignTransactionParams extends CommonParams {
        inputs: Input[];
        outputs: Output[];
        refTxs?: RefTransaction[];
        coin: string;
        locktime?: number;
        version?: number;
        expiry?: number;
        branchId?: number;
        push?: boolean;
    }

    export interface PushTransactionParams extends CommonParams {
        tx: string;
        coin: string;
    }

    export interface TransactionID {
        txid: string;
    }

    export namespace DEVICE {
        // device list events
        export const CONNECT = 'device-connect';
        export const CONNECT_UNACQUIRED = 'device-connect_unacquired';
        export const DISCONNECT = 'device-disconnect';
        export const CHANGED = 'device-changed';
        export const ACQUIRE = 'device-acquire';
        export const RELEASE = 'device-release';
        export const ACQUIRED = 'device-acquired';
        export const RELEASED = 'device-released';
        export const USED_ELSEWHERE = 'device-used_elsewhere';

        export const LOADING = 'device-loading';

        // trezor-link events in protobuf format
        export const BUTTON = 'button';
        export const PIN = 'pin';
        export const PASSPHRASE = 'passphrase';
        export const PASSPHRASE_ON_DEVICE = 'passphrase_on_device';
        export const WORD = 'word';

        // custom
        export const WAIT_FOR_SELECTION = 'device-wait_for_selection';

        // this string has different prefix than other constants and it's used as device path
        export const UNREADABLE = 'unreadable-device';
    }
    export const DEVICE_EVENT = 'DEVICE_EVENT';

    export interface DeviceEvent {
        event: typeof DEVICE_EVENT;
        type:
            | typeof DEVICE.CONNECT
            | typeof DEVICE.CONNECT_UNACQUIRED
            | typeof DEVICE.CHANGED
            | typeof DEVICE.DISCONNECT;
        payload: Device;
    }

    export const TRANSPORT_EVENT = 'TRANSPORT_EVENT';
    export namespace TRANSPORT {
        export const START = 'transport-start';
        export const ERROR = 'transport-error';
        export const UPDATE = 'transport-update';
        export const STREAM = 'transport-stream';
        export const REQUEST = 'transport-request_device';
        export const RECONNECT = 'transport-reconnect';
        export const START_PENDING = 'transport-start_pending';
    }
    export type TransportEvent =
        | {
              event: typeof TRANSPORT_EVENT;
              type: typeof TRANSPORT.START;
              payload: any;
          }
        | {
              event: typeof TRANSPORT_EVENT;
              type: typeof TRANSPORT.ERROR;
              payload: string;
          };
    export const BLOCKCHAIN_EVENT = 'BLOCKCHAIN_EVENT';

    export const UI_EVENT = 'UI_EVENT';
    export namespace UI {
        export const REQUEST_CONFIRMATION = 'ui-request_confirmation';
        export const RECEIVE_CONFIRMATION = 'ui-receive_confirmation';
        export const ADDRESS_VALIDATION = 'ui-address_validation';
        export const BUNDLE_PROGRESS = 'ui-bundle_progress';
    }

    export interface UiEvent {
        event: typeof UI_EVENT;
        type: typeof UI.REQUEST_CONFIRMATION;
        payload: any;
    }
    export interface UIResponse {
        type: typeof UI.RECEIVE_CONFIRMATION;
        payload: boolean;
    }

    namespace TrezorConnect {
        /**
         * Initializes TrezorConnect.
         */
        function init(settings: Settings): void;

        /**
         * Retrieves BIP32 extended public derived by given BIP32 path.
         * User is presented with a description of the requested key and asked to
         * confirm the export.
         */
        function getPublicKey(params: GetPublicKeyParams): Promise<ResponseMessage<PublicKey>>;
        function getPublicKey(
            params: Bundle<GetPublicKeyParams>,
        ): Promise<ResponseMessage<PublicKey[]>>;

        /**
         * Challenge-response authentication via Trezor.
         * To protect against replay attacks you should use a server-side generated
         * and randomized challengeHidden for every attempt. You can also provide a
         * visual challenge that will be shown on the device.
         */
        function requestLogin(params: RequestLoginParams): Promise<LoginDetails>;

        /**
         * Retrieves the set of features associated with the device.
         */
        function getFeatures(params?: CommonParams): Promise<ResponseMessage<Features>>;

        /**
         * Retrieves the settings that TrezorConnect was initialized with.
         */
        function getSettings(): Promise<ResponseMessage<Settings>>;

        /**
         * Asks device to encrypt value using the private key derived by given BIP32
         * path and the given key. IV is always computed automatically.
         */
        function cipherKeyValue(
            params: CipherKeyValueParams,
        ): Promise<ResponseMessage<CipherKeyValue>>;
        function cipherKeyValue(
            params: Bundle<CipherKeyValueParams>,
        ): Promise<ResponseMessage<CipherKeyValue[]>>;

        /**
         * Resets device to factory defaults and removes all private data.
         */
        function wipeDevice(params?: CommonParams): Promise<ResponseMessage<Message>>;

        /**
         * Performs device setup and generates a new seed.
         */
        function resetDevice(params: ResetDeviceParams): Promise<ResponseMessage<Message>>;

        /**
         * Display requested address derived by given BIP32 path on device and
         * returns it to caller. User is asked to confirm the export on Trezor.
         */
        function getAddress(params: GetAddressParams): Promise<ResponseMessage<Address>>;
        function getAddress(params: Bundle<GetAddressParams>): Promise<ResponseMessage<Address[]>>;

        /**
         * Gets an info of specified account.
         */
        function getAccountInfo(
            params: CommonParams & AccountInfoRequest,
        ): Promise<ResponseMessage<AccountInfo>>;
        function getAccountInfo(
            params: CommonParams & Bundle<AccountInfoRequest>,
        ): Promise<ResponseMessage<AccountInfo[]>>;

        /**
         * Requests a payment from the users wallet to a set of given outputs.
         * Internally a BIP-0044 account discovery is performed and user is presented
         * with a list of accounts. After account selection user is presented with
         * list of fee selection. After selecting a fee transaction is signed and
         * returned in hexadecimal format. Change output is added automatically, if
         * needed.
         */
        function composeTransaction(
            params: ComposeTransactionParams,
        ): Promise<ResponseMessage<Transaction>>;

        /**
         * Asks device to sign given inputs and outputs of pre-composed transaction.
         * User is asked to confirm all transaction details on Trezor.
         */
        function signTransaction(
            params: SignTransactionParams,
        ): Promise<ResponseMessage<SignedTransaction>>;

        /**
         * Broadcasts the transaction to the selected network.
         */
        function pushTransaction(
            params: PushTransactionParams,
        ): Promise<ResponseMessage<TransactionID>>;

        /**
         * Asks device to sign a message using the private key derived by given BIP32
         * path.
         */
        function signMessage(params: SignMessageParams): Promise<ResponseMessage<SignedMessage>>;

        /**
         * Asks device to verify a message using the signer address and signature.
         */
        function verifyMessage(params: VerifyMessageParams): Promise<ResponseMessage<Message>>;

        function dispose(): void;

        function cancel(params?: string): void;

        function on(event: typeof TRANSPORT_EVENT, callback: (event: TransportEvent) => void): void;
        function on(event: typeof UI_EVENT, callback: (event: UiEvent) => void): void;
        function on(event: typeof DEVICE_EVENT, callback: (event: DeviceEvent) => void): void;
        function on(event: any, callback: (event: any) => void): void;

        function off(event: any, callback: (event: any) => void): void;

        function uiResponse(a: UIResponse): void;
    }

    export default TrezorConnect;
}
