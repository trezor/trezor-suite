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
        fee: string;
        // total?: string; // amount + total

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
        balance?: string; // token balance
        name?: string; // token name
        symbol?: string; // token symbol
        decimals: number; // token decimals or 0
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
        payload: { error: string; code?: string | number };
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

    export interface CommonParams {
        device?: {
            path: string;
            state?: string;
            instance?: number;
        };
        useEmptyPassphrase?: boolean;
        allowSeedlessDevice?: boolean;
        keepSession?: boolean;
        skipFinalReload?: boolean;
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

    interface LoginChallenge {
        challengeHidden: string;
        challengeVisual: string;
    }

    export type RequestLoginParams =
        | (CommonParams & { callback: () => LoginChallenge })
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
        backupType?: 0 | 1;
    }

    export interface ApplySettingsParams extends CommonParams {
        homescreen?: string;
        display_rotation?: 0 | 90 | 180 | 270;
        use_passphrase?: boolean;
        label?: string;
    }
    export interface ApplyFlagsParams extends CommonParams {
        flags: number;
    }
    export interface RecoveryDeviceParams extends CommonParams {
        passphrase_protection?: boolean;
        pin_protection?: boolean;
        label?: string;
        type?: 0 | 1;
        dry_run?: boolean;
        word_count?: 12 | 18 | 24;
        // there are more of them but dont have a valid usecase now
    }

    export interface ChangePinParams extends CommonParams {
        remove?: boolean;
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

    export interface PrecomposeTransactionParams extends CommonParams {
        outputs: Output[];
        account: {
            path: string;
            addresses: AccountAddresses;
            utxo: AccountUtxo[];
        };
        feeLevels: {
            feePerUnit: string;
        }[];
        coin: string;
    }

    export type PrecomposedTransaction =
        | {
              type: 'error';
              error: string;
          }
        | {
              type: 'nonfinal';
              max: string;
              totalSpent: string; // all the outputs, no fee, no change
              fee: string;
              feePerByte: string;
              bytes: number;
          }
        | {
              type: 'final';
              max: string;
              totalSpent: string; // all the outputs, no fee, no change
              fee: string;
              feePerByte: string;
              bytes: number;
              transaction: {
                  inputs: TransactionInput[];
                  outputs: TransactionOutput[];
              };
          };

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
    export interface FirmwareUpdateParams extends CommonParams {
        payload: ArrayBuffer;
    }

    export interface BackupDeviceParams extends CommonParams {}

    export interface SignedMessage {
        address: string; // signer address
        signature: string; // signature in base64 format
    }

    export type DeviceStatus = 'available' | 'occupied' | 'used';

    export type DeviceMode = 'normal' | 'bootloader' | 'initialize' | 'seedless';

    export type DeviceFirmwareStatus = 'valid' | 'outdated' | 'required' | 'unknown' | 'none';

    export type UnavailableCapability =
        | 'no-capability'
        | 'no-support'
        | 'update-required'
        | 'trezor-connect-outdated'
        | string[];

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

    export interface Features {
        bootloader_hash?: string | null;
        bootloader_mode?: boolean | null;
        device_id: string | null;
        firmware_present?: boolean | null;
        flags: number;
        fw_major?: number | null;
        fw_minor?: number | null;
        fw_patch?: number | null;
        fw_vendor?: string | null;
        fw_vendor_keys?: string | null;
        imported?: boolean | null;
        initialized: boolean;
        label: string | null;
        language?: string | null;
        major_version: number;
        minor_version: number;
        model: string;
        needs_backup: boolean;
        no_backup: boolean;
        passphrase_cached: boolean;
        passphrase_protection: boolean;
        patch_version: number;
        pin_cached: boolean;
        pin_protection: boolean;
        revision: string;
        unfinished_backup: boolean;
        vendor: string;
        recovery_mode?: boolean;
        session_id?: string;
        passphrase_always_on_device?: boolean;
        capabilities?: string[];
    }

    export type Device =
        | {
              type: 'acquired';
              path: string;
              label: string;
              firmware: DeviceFirmwareStatus;
              firmwareRelease?: FirmwareRelease;
              status: DeviceStatus;
              mode: DeviceMode;
              state?: string;
              features: Features;
              unavailableCapabilities: { [key: string]: UnavailableCapability };
          }
        | {
              type: 'unacquired' | 'unreadable';
              path: string;
              label: string;
              features: undefined;
          };

    export interface SignedTransaction {
        signatures: string[];
        serializedTx: string;
        txid?: string;
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
    export interface NoAddressOutput {
        type: 'noaddress';
        amount: string;
    }

    export interface NoAddressSendMaxOutput {
        type: 'send-max-noaddress';
    }

    export type Output =
        | RegularOutput
        | InternalOutput
        | SendMaxOutput
        | OpReturnOutput
        | NoAddressOutput
        | NoAddressSendMaxOutput;

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

    export interface DeviceStateResponse {
        state: string;
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
        export const DISABLE_WEBUSB = 'transport-disable_webusb';
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
    export namespace BLOCKCHAIN {
        export const CONNECT = 'blockchain-connect';
        export const ERROR = 'blockchain-error';
        export const NOTIFICATION = 'blockchain-notification';
        export const BLOCK = 'blockchain-block';
    }

    export type BlockchainEvent =
        | {
              type: typeof BLOCKCHAIN.CONNECT;
              payload: BlockchainInfo;
          }
        | {
              type: typeof BLOCKCHAIN.ERROR;
              payload: {
                  coin: BlockchainCoin;
                  error: string;
              };
          }
        | {
              type: typeof BLOCKCHAIN.BLOCK;
              payload: BlockchainBlock;
          }
        | {
              type: typeof BLOCKCHAIN.NOTIFICATION;
              payload: BlockchainNotification;
          };

    export const UI_EVENT = 'UI_EVENT';
    export namespace UI {
        export const TRANSPORT = 'ui-no_transport';
        export const BOOTLOADER = 'ui-device_bootloader_mode';
        export const NOT_IN_BOOTLOADER = 'ui-device_not_in_bootloader_mode';
        export const REQUIRE_MODE = 'ui-device_require_mode';
        export const INITIALIZE = 'ui-device_not_initialized';
        export const SEEDLESS = 'ui-device_seedless';
        export const FIRMWARE_OLD = 'ui-device_firmware_old';
        export const FIRMWARE_OUTDATED = 'ui-device_firmware_outdated';
        export const FIRMWARE_NOT_SUPPORTED = 'ui-device_firmware_unsupported';
        export const FIRMWARE_NOT_COMPATIBLE = 'ui-device_firmware_not_compatible';
        export const FIRMWARE_NOT_INSTALLED = 'ui-device_firmware_not_installed';
        export const DEVICE_NEEDS_BACKUP = 'ui-device_needs_backup';
        export const BROWSER_NOT_SUPPORTED = 'ui-browser_not_supported';
        export const BROWSER_OUTDATED = 'ui-browser_outdated';
        export const RECEIVE_BROWSER = 'ui-receive_browser';

        export const REQUEST_UI_WINDOW = 'ui-request_window';
        export const CLOSE_UI_WINDOW = 'ui-close_window';

        export const REQUEST_PERMISSION = 'ui-request_permission';
        export const REQUEST_CONFIRMATION = 'ui-request_confirmation';
        export const REQUEST_PIN = 'ui-request_pin';
        export const INVALID_PIN = 'ui-invalid_pin';
        export const REQUEST_PASSPHRASE = 'ui-request_passphrase';
        export const REQUEST_PASSPHRASE_ON_DEVICE = 'ui-request_passphrase_on_device';
        export const INVALID_PASSPHRASE = 'ui-invalid_passphrase';
        export const INVALID_PASSPHRASE_ACTION = 'ui-invalid_passphrase_action';
        export const CONNECT = 'ui-connect';
        export const LOADING = 'ui-loading';
        export const SET_OPERATION = 'ui-set_operation';
        export const SELECT_DEVICE = 'ui-select_device';
        export const SELECT_ACCOUNT = 'ui-select_account';
        export const SELECT_FEE = 'ui-select_fee';
        export const UPDATE_CUSTOM_FEE = 'ui-update_custom_fee';
        export const INSUFFICIENT_FUNDS = 'ui-insufficient_funds';
        export const REQUEST_BUTTON = 'ui-button';
        export const REQUEST_WORD = 'ui-request_word';

        export const RECEIVE_PERMISSION = 'ui-receive_permission';
        export const RECEIVE_CONFIRMATION = 'ui-receive_confirmation';
        export const RECEIVE_PIN = 'ui-receive_pin';
        export const RECEIVE_PASSPHRASE = 'ui-receive_passphrase';
        export const RECEIVE_DEVICE = 'ui-receive_device';
        export const CHANGE_ACCOUNT = 'ui-change_account';
        export const RECEIVE_ACCOUNT = 'ui-receive_account';
        export const RECEIVE_FEE = 'ui-receive_fee';
        export const RECEIVE_WORD = 'ui-receive_word';

        export const CHANGE_SETTINGS = 'ui-change_settings';

        export const CUSTOM_MESSAGE_REQUEST = 'ui-custom_request';
        export const CUSTOM_MESSAGE_RESPONSE = 'ui-custom_response';

        export const LOGIN_CHALLENGE_REQUEST = 'ui-login_challenge_request';
        export const LOGIN_CHALLENGE_RESPONSE = 'ui-login_challenge_response';

        export const BUNDLE_PROGRESS = 'ui-bundle_progress';
        export const ADDRESS_VALIDATION = 'ui-address_validation';
        export const FIRMWARE_PROGRESS = 'ui-firmware_progress';
    }

    export namespace IFRAME {
        export const BOOTSTRAP = 'iframe-bootstrap';
        export const LOADED = 'iframe-loaded';
        export const INIT = 'iframe-init';
        export const ERROR = 'iframe-error';
        export const CALL = 'iframe-call';
    }

    export type UiEvent =
        | {
              type:
                  | typeof UI.REQUEST_PIN
                  | typeof UI.INVALID_PIN
                  | typeof UI.REQUEST_PASSPHRASE_ON_DEVICE
                  | typeof UI.REQUEST_PASSPHRASE
                  | typeof UI.INVALID_PASSPHRASE
                  | typeof UI.REQUEST_WORD;
              payload: {
                  device: Device;
                  type?: string;
              };
          }
        | {
              type: typeof UI.REQUEST_BUTTON;
              payload: {
                  device: Device;
                  code: string;
                  data?: {
                      type: 'address';
                      serializedPath: string;
                      address: string;
                  };
              };
          }
        | {
              type: typeof UI.REQUEST_CONFIRMATION;
              payload: {
                  view: string;
                  label?: string;
                  customConfirmButton?: {
                      className: string;
                      label: string;
                  };
                  customCancelButton?: {
                      className: string;
                      label: string;
                  };
              };
          }
        | {
              type: typeof UI.ADDRESS_VALIDATION;
              payload: {
                  type: 'address';
                  serializedPath: string;
                  address: string;
              };
          }
        | {
              type:
                  | typeof UI.REQUEST_UI_WINDOW
                  | typeof UI.TRANSPORT
                  | typeof UI.RECEIVE_BROWSER
                  | typeof UI.CHANGE_ACCOUNT
                  | typeof UI.INSUFFICIENT_FUNDS
                  | typeof UI.CLOSE_UI_WINDOW
                  | typeof UI.LOGIN_CHALLENGE_REQUEST;
              payload: undefined;
          }
        | {
              type: typeof IFRAME.LOADED;
          }
        | {
              type: typeof UI.FIRMWARE_PROGRESS;
              payload: {
                  progress: number;
              };
          };

    export type UIResponse =
        | {
              type: typeof UI.RECEIVE_PERMISSION;
              payload: {
                  granted: boolean;
                  remember: boolean;
              };
          }
        | {
              type: typeof UI.RECEIVE_CONFIRMATION;
              payload: boolean;
          }
        | {
              type: typeof UI.RECEIVE_DEVICE;
              payload: {
                  device: Device;
                  remember: boolean;
              };
          }
        | {
              type: typeof UI.RECEIVE_PIN | typeof UI.RECEIVE_WORD;
              payload: string;
          }
        | {
              type: typeof UI.RECEIVE_PASSPHRASE;
              payload: {
                  save: boolean;
                  value: string;
                  passphraseOnDevice?: boolean;
              };
          };

    export interface BlockchainSubscribeParams {
        accounts: {
            descriptor: string;
            addresses?: AccountAddresses;
        }[];
        coin: string;
    }

    export interface BlockchainSubscribeResponse {
        subscribed: boolean;
    }

    export interface BlockchainInfo {
        coin: BlockchainCoin;
        url: string;
        blockHash: string;
        blockHeight: number;
        decimals: number;
        name: string;
        shortcut: string;
        testnet: boolean;
        version: string;
        misc?: {
            reserve?: string;
        };
    }

    export interface BlockchainBlock {
        blockHash: string;
        blockHeight: number;
        coin: BlockchainCoin;
    }

    export interface BlockchainNotification {
        notification: {
            descriptor: string;
            tx: AccountTransaction;
        };
        coin: BlockchainCoin;
    }

    export interface BlockchainCoin {
        type: 'misc';
        blockchainLink: {
            type: 'ripple' | 'blockbook';
            url: string[];
        };
        blocktime: number | null;
        curve: string;
        defaultFees: { Normal: number };
        minFee: 1;
        maxFee: 1;
        label: string;
        name: string;
        shortcut: string;
        slip44: number;
        support: {
            connect: boolean;
            trezor1: boolean;
            trezor2: string;
            webwallet: boolean;
        };
        decimals: number;
        chain?: string; // eth
        chainId?: 3; // eth
        rskip60?: number; // eth
    }

    interface BlockchainEstimateFeeParams {
        coin: string;
        request?: {
            blocks?: number[];
            specific?: {
                conservative?: boolean;
                data?: string;
                from?: string;
                to?: string;
                txsize?: number;
            };
            feeLevels?: 'preloaded' | 'smart';
        };
    }

    export interface FeeLevel {
        label: 'high' | 'normal' | 'economy' | 'low' | 'custom';
        feePerUnit: string;
        blocks: number;
        feeLimit?: string; // eth gas limit
        feePerTx?: string; // fee for BlockchainEstimateFeeParams.request.specific
    }

    interface BlockchainEstimateFeeResponse {
        blockTime: number;
        minFee: number;
        maxFee: number;
        levels: FeeLevel[];
    }

    namespace TrezorConnect {
        /**
         * Initializes TrezorConnect.
         */
        function init(settings: Settings): Promise<void>;

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

        function applySettings(params: ApplySettingsParams): Promise<ResponseMessage<Message>>;

        function changePin(params?: ChangePinParams): Promise<ResponseMessage<Message>>;

        /**
         * Display requested address derived by given BIP32 path on device and
         * returns it to caller. User is asked to confirm the export on Trezor.
         */
        function getAddress(params: GetAddressParams): Promise<ResponseMessage<Address>>;
        function getAddress(params: Bundle<GetAddressParams>): Promise<ResponseMessage<Address[]>>;

        function ethereumGetAddress(params: GetAddressParams): Promise<ResponseMessage<Address>>;
        function ethereumGetAddress(
            params: Bundle<GetAddressParams>,
        ): Promise<ResponseMessage<Address[]>>;

        function rippleGetAddress(params: GetAddressParams): Promise<ResponseMessage<Address>>;
        function rippleGetAddress(
            params: Bundle<GetAddressParams>,
        ): Promise<ResponseMessage<Address[]>>;

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
        function composeTransaction(
            params: PrecomposeTransactionParams,
        ): Promise<ResponseMessage<PrecomposedTransaction[]>>;

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

        /**
         * Sends FirmwareErase message followed by FirmwareUpdate message
         */
        function firmwareUpdate(params: FirmwareUpdateParams): Promise<ResponseMessage<Message>>;
        /**
         * Asks device to initiate seed backup procedure
         */
        function backupDevice(params: BackupDeviceParams): Promise<ResponseMessage<Message>>;
        /**
         * Ask device to initiate recovery procedure
         */
        function recoveryDevice(params: RecoveryDeviceParams): Promise<ResponseMessage<Message>>;

        /**
         * Increment saved flag on device
         */
        function applyFlags(params: ApplyFlagsParams): Promise<ResponseMessage<Message>>;

        function dispose(): void;

        function cancel(params?: string): void;

        function on(event: typeof TRANSPORT_EVENT, callback: (event: TransportEvent) => void): void;
        function on(
            event: typeof UI_EVENT,
            callback: (event: { event: typeof UI_EVENT } & UiEvent) => void,
        ): void;
        function on(event: typeof DEVICE_EVENT, callback: (event: DeviceEvent) => void): void;
        function on(event: any, callback: (event: any) => void): void;

        function off(event: any, callback: (event: any) => void): void;

        function uiResponse(a: UIResponse): void;

        function renderWebUSBButton(): void;

        function getDeviceState(
            params: CommonParams,
        ): Promise<ResponseMessage<DeviceStateResponse>>;

        function disableWebUSB(): void;

        function blockchainSubscribe(
            params: BlockchainSubscribeParams,
        ): Promise<ResponseMessage<BlockchainSubscribeResponse>>;

        function blockchainEstimateFee(
            params: BlockchainEstimateFeeParams,
        ): Promise<ResponseMessage<BlockchainEstimateFeeResponse>>;
    }

    export default TrezorConnect;
}
