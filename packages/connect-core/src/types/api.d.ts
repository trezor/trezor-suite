import * as Protobuf from '@trezor/transport';

import * as CONSTANTS from './constants';
import * as P from './params';
import * as Device from './trezor/device';
import * as Mgmnt from './trezor/management';
import * as Account from './account';

import * as Bitcoin from './networks/bitcoin';
import * as Binance from './networks/binance';
import * as Cardano from './networks/cardano';
import * as CoinInfo from './networks/coinInfo';
import * as EOS from './networks/eos';
import * as Ethereum from './networks/ethereum';
import * as NEM from './networks/nem';
import * as Ripple from './networks/ripple';
import * as Stellar from './networks/stellar';
import * as Tezos from './networks/tezos';
import * as Misc from './misc';

import * as Events from './events';
import * as Blockchain from './backend/blockchain';

export namespace TrezorConnect {
    /**
     * Set TrezorConnect manifest.
     */
    function manifest(params: P.Manifest): void;

    /**
     * Initializes TrezorConnect.
     * `manifest` is required
     */
    function init(settings: { manifest: P.Manifest } & Partial<P.ConnectSettings>): Promise<void>;

    /**
     * Retrieves the settings that TrezorConnect was initialized with.
     */
    function getSettings(): P.Response<P.ConnectSettings>;

    function dispose(): void;

    function cancel(params?: string): void;

    function renderWebUSBButton(): void;

    function disableWebUSB(): void;

    /**
     * Event listeners
     */
    function on(
        type: typeof CONSTANTS.DEVICE_EVENT,
        cb: (event: Device.DeviceEvent & { event: typeof CONSTANTS.DEVICE_EVENT }) => void,
    ): void;
    function on(
        type: typeof CONSTANTS.TRANSPORT_EVENT,
        cb: (event: Events.TransportEvent & { event: typeof CONSTANTS.TRANSPORT_EVENT }) => void,
    ): void;
    function on(
        type: typeof CONSTANTS.UI_EVENT,
        cb: (event: Events.UiEvent & { event: typeof CONSTANTS.UI_EVENT }) => void,
    ): void;
    function on(
        type: typeof CONSTANTS.BLOCKCHAIN_EVENT,
        cb: (
            event: Blockchain.BlockchainEvent & { event: typeof CONSTANTS.BLOCKCHAIN_EVENT },
        ) => void,
    ): void;
    function on(type: Events.MessageWithoutPayload['type'], cb: () => void): void;
    function on(
        type: Events.DeviceMessage['type'],
        cb: (event: Events.DeviceMessage['payload']) => void,
    ): void;
    function on(
        type: Events.ButtonRequestMessage['type'],
        cb: (event: Events.ButtonRequestMessage['payload']) => void,
    ): void;
    function on(
        type: Events.AddressValidationMessage['type'],
        cb: (event: Events.AddressValidationMessage['payload']) => void,
    ): void;
    function on(
        type: Events.RequestPermission['type'],
        cb: (event: Events.RequestPermission['payload']) => void,
    ): void;
    function on(
        type: Events.RequestConfirmation['type'],
        cb: (event: Events.RequestConfirmation['payload']) => void,
    ): void;
    function on(
        type: Events.UnexpectedDeviceMode['type'],
        cb: (event: Events.UnexpectedDeviceMode['payload']) => void,
    ): void;
    function on(
        type: Events.FirmwareException['type'],
        cb: (event: Events.FirmwareException['payload']) => void,
    ): void;
    function on<R>(
        type: typeof CONSTANTS.UI.BUNDLE_PROGRESS,
        cb: (event: Events.BundleProgress<R>['payload']) => void,
    ): void;
    function on(
        type: Events.FirmwareProgress['type'],
        cb: (event: Events.FirmwareProgress['payload']) => void,
    ): void;
    function on(
        type: Events.CustomMessageRequest['type'],
        cb: (event: Events.CustomMessageRequest['payload']) => void,
    ): void;
    function off(type: string, cb: any): void;
    function removeAllListeners(): void;

    function uiResponse(response: Events.UiResponse): void;

    /**
     * Backend operations
     */
    function blockchainEstimateFee(
        params: P.CommonParams & Blockchain.BlockchainEstimateFee,
    ): P.Response<Blockchain.BlockchainEstimatedFee>;
    function blockchainGetAccountBalanceHistory(
        params: Blockchain.BlockchainGetAccountBalanceHistory,
    ): P.Response<Blockchain.BlockchainAccountBalanceHistory[]>;
    function blockchainGetCurrentFiatRates(
        params: Blockchain.BlockchainGetCurrentFiatRates,
    ): P.Response<Blockchain.BlockchainTimestampedFiatRates>;
    function blockchainGetFiatRatesForTimestamps(
        params: Blockchain.BlockchainGetFiatRatesForTimestamps,
    ): P.Response<Blockchain.BlockchainFiatRatesForTimestamps>;
    function blockchainGetTransactions(
        params: P.CommonParams & Blockchain.BlockchainGetTransactions,
    ): P.Response<Blockchain.BlockchainTransactions>;
    function blockchainSetCustomBackend(
        params: P.CommonParams & Blockchain.BlockchainSetCustomBackend,
    ): P.Response<boolean>;
    function blockchainSubscribe(
        params: P.CommonParams & Blockchain.BlockchainSubscribe,
    ): P.Response<Blockchain.BlockchainSubscribed>;
    function blockchainSubscribeFiatRates(
        params: Blockchain.BlockchainSubscribeFiatRates,
    ): P.Response<Blockchain.BlockchainSubscribed>;
    function blockchainUnsubscribe(
        params: P.CommonParams & Blockchain.BlockchainSubscribe,
    ): P.Response<Blockchain.BlockchainSubscribed>;
    function blockchainUnsubscribeFiatRates(
        params: Blockchain.BlockchainSubscribeFiatRates,
    ): P.Response<Blockchain.BlockchainSubscribed>;
    function blockchainDisconnect(
        params: P.CommonParams & Blockchain.BlockchainDisconnect,
    ): P.Response<Blockchain.BlockchainDisconnected>;

    /**
     * Bitcoin and Bitcoin-like
     * Display requested address derived by given BIP32 path on device and
     * returns it to caller. User is asked to confirm the export on Trezor.
     */
    function getAddress(params: P.CommonParams & Bitcoin.GetAddress): P.Response<Bitcoin.Address>;
    function getAddress(
        params: P.CommonParams & P.Bundle<Bitcoin.GetAddress>,
    ): P.BundledResponse<Bitcoin.Address>;

    /**
     * Bitcoin and Bitcoin-like
     * Retrieves BIP32 extended public derived by given BIP32 path.
     * User is presented with a description of the requested key and asked to
     * confirm the export.
     */
    function getPublicKey(
        params: P.CommonParams & Bitcoin.GetPublicKey,
    ): P.Response<Bitcoin.HDNodeResponse>;
    function getPublicKey(
        params: P.CommonParams & P.Bundle<Bitcoin.GetPublicKey>,
    ): P.BundledResponse<Bitcoin.HDNodeResponse>;

    /**
     * Bitcoin and Bitcoin-like
     * Asks device to sign given inputs and outputs of pre-composed transaction.
     * User is asked to confirm all transaction details on Trezor.
     */
    function signTransaction(
        params: P.CommonParams & Bitcoin.SignTransaction,
    ): P.Response<Bitcoin.SignedTransaction>;

    /**
     * Bitcoin, Bitcoin-like, Ethereum-like, Ripple
     * Broadcasts the transaction to the selected network.
     */
    function pushTransaction(
        params: P.CommonParams & Bitcoin.PushTransaction,
    ): P.Response<Bitcoin.PushedTransaction>;

    /**
     * Bitcoin and Bitcoin-like
     * Requests a payment from the users wallet to a set of given outputs.
     * Internally a BIP-0044 account discovery is performed and user is presented
     * with a list of accounts. After account selection user is presented with
     * list of fee selection. After selecting a fee transaction is signed and
     * returned in hexadecimal format. Change output is added automatically, if
     * needed.
     */
    function composeTransaction(
        params: P.CommonParams & Account.ComposeParams,
    ): P.Response<Bitcoin.SignedTransaction>;
    function composeTransaction(
        params: P.CommonParams & Account.PrecomposeParams,
    ): P.Response<Account.PrecomposedTransaction[]>;

    /**
     * Bitcoin, Bitcoin-like, Ethereum-like, Ripple
     * Gets an info of specified account.
     */
    function getAccountInfo(
        params: P.CommonParams & Account.GetAccountInfo,
    ): P.Response<Account.AccountInfo>;
    function getAccountInfo(
        params: P.CommonParams & P.Bundle<Account.GetAccountInfo>,
    ): P.BundledResponse<Account.AccountInfo>;

    /**
     * Bitcoin and Bitcoin-like
     * Asks device to sign a message using the private key derived by given BIP32
     * path.
     */
    function signMessage(
        params: P.CommonParams & Bitcoin.SignMessage,
    ): P.Response<Protobuf.MessageSignature>;

    /**
     * Bitcoin and Bitcoin-like
     * Asks device to verify a message using the signer address and signature.
     */
    function verifyMessage(
        params: P.CommonParams & Bitcoin.VerifyMessage,
    ): P.Response<P.DefaultMessage>;

    // Binance
    function binanceGetAddress(
        params: P.CommonParams & Binance.BinanceGetAddress,
    ): P.Response<Binance.BinanceAddress>;
    function binanceGetAddress(
        params: P.CommonParams & P.Bundle<Binance.BinanceGetAddress>,
    ): P.BundledResponse<Binance.BinanceAddress>;
    function binanceGetPublicKey(
        params: P.CommonParams & Binance.BinanceGetPublicKey,
    ): P.Response<Binance.BinancePublicKey>;
    function binanceGetPublicKey(
        params: P.CommonParams & P.Bundle<Binance.BinanceGetPublicKey>,
    ): P.BundledResponse<Binance.BinancePublicKey>;
    function binanceSignTransaction(
        params: P.CommonParams & Binance.BinanceSignTransaction,
    ): P.Response<Protobuf.BinanceSignedTx>;

    // Cardano (ADA)
    function cardanoGetAddress(
        params: P.CommonParams & Cardano.CardanoGetAddress,
    ): P.Response<Cardano.CardanoAddress>;
    function cardanoGetAddress(
        params: P.CommonParams & P.Bundle<Cardano.CardanoGetAddress>,
    ): P.BundledResponse<Cardano.CardanoAddress>;
    function cardanoGetNativeScriptHash(
        params: P.CommonParams & Cardano.CardanoGetNativeScriptHash,
    ): P.Response<Cardano.CardanoNativeScriptHash>;
    function cardanoGetPublicKey(
        params: P.CommonParams & Cardano.CardanoGetPublicKey,
    ): P.Response<Cardano.CardanoPublicKey>;
    function cardanoGetPublicKey(
        params: P.CommonParams & P.Bundle<Cardano.CardanoGetPublicKey>,
    ): P.BundledResponse<Cardano.CardanoPublicKey>;
    function cardanoSignTransaction(
        params: P.CommonParams & Cardano.CardanoSignTransaction,
    ): P.Response<Cardano.CardanoSignedTxData>;

    // EOS
    function eosGetPublicKey(
        params: P.CommonParams & EOS.EosGetPublicKey,
    ): P.Response<EOS.EosPublicKey>;
    function eosGetPublicKey(
        params: P.CommonParams & P.Bundle<EOS.EosGetPublicKey>,
    ): P.BundledResponse<EOS.EosPublicKey>;
    function eosSignTransaction(
        params: P.CommonParams & EOS.EosSignTransaction,
    ): P.Response<Protobuf.EosSignedTx>;

    // Ethereum and Ethereum-like
    function ethereumGetAddress(
        params: P.CommonParams & Ethereum.EthereumGetAddress,
    ): P.Response<Ethereum.EthereumAddress>;
    function ethereumGetAddress(
        params: P.CommonParams & P.Bundle<Ethereum.EthereumGetAddress>,
    ): P.BundledResponse<Ethereum.EthereumAddress>;
    function ethereumGetPublicKey(
        params: P.CommonParams & Ethereum.EthereumGetPublicKey,
    ): P.Response<Bitcoin.HDNodeResponse>;
    function ethereumGetPublicKey(
        params: P.CommonParams & P.Bundle<Ethereum.EthereumGetPublicKey>,
    ): P.BundledResponse<Bitcoin.HDNodeResponse>;
    function ethereumSignTransaction(
        params: P.CommonParams & Ethereum.EthereumSignTransaction,
    ): P.Response<Ethereum.EthereumSignedTx>;
    function ethereumSignTransaction(
        params: P.CommonParams & P.Bundle<Ethereum.EthereumSignTransaction>,
    ): P.BundledResponse<Ethereum.EthereumSignedTx>;
    function ethereumSignMessage(
        params: P.CommonParams & Ethereum.EthereumSignMessage,
    ): P.Response<Protobuf.MessageSignature>;
    /**
     * @param params Passing:
     * - {@link Ethereum.EthereumSignTypedData} is required for Trezor T
     * - {@link Ethereum.EthereumSignTypedHash} is required for Trezor 1 compatability
     */
    function ethereumSignTypedData<T extends Ethereum.EthereumSignTypedDataTypes>(
        params: P.CommonParams &
            (Ethereum.EthereumSignTypedData<T> | Ethereum.EthereumSignTypedHashAndData<T>),
    ): P.Response<Protobuf.EthereumTypedDataSignature>;
    function ethereumVerifyMessage(
        params: P.CommonParams & Ethereum.EthereumVerifyMessage,
    ): P.Response<P.DefaultMessage>;

    // NEM
    function nemGetAddress(params: P.CommonParams & NEM.NEMGetAddress): P.Response<NEM.NEMAddress>;
    function nemGetAddress(
        params: P.CommonParams & P.Bundle<NEM.NEMGetAddress>,
    ): P.BundledResponse<NEM.NEMAddress>;
    function nemSignTransaction(
        params: P.CommonParams & NEM.NEMSignTransaction,
    ): P.Response<Protobuf.NEMSignedTx>;

    // Ripple
    function rippleGetAddress(
        params: P.CommonParams & Ripple.RippleGetAddress,
    ): P.Response<Ripple.RippleAddress>;
    function rippleGetAddress(
        params: P.CommonParams & P.Bundle<Ripple.RippleGetAddress>,
    ): P.BundledResponse<Ripple.RippleAddress>;
    function rippleSignTransaction(
        params: P.CommonParams & Ripple.RippleSignTransaction,
    ): P.Response<Ripple.RippleSignedTx>;

    // Stellar
    function stellarGetAddress(
        params: P.CommonParams & Stellar.StellarGetAddress,
    ): P.Response<Stellar.StellarAddress>;
    function stellarGetAddress(
        params: P.CommonParams & P.Bundle<Stellar.StellarGetAddress>,
    ): P.BundledResponse<Stellar.StellarAddress>;
    function stellarSignTransaction(
        params: P.CommonParams & Stellar.StellarSignTransaction,
    ): P.Response<Stellar.StellarSignedTx>;

    // // Tezos
    function tezosGetAddress(
        params: P.CommonParams & Tezos.TezosGetAddress,
    ): P.Response<Tezos.TezosAddress>;
    function tezosGetAddress(
        params: P.CommonParams & P.Bundle<Tezos.TezosGetAddress>,
    ): P.BundledResponse<Tezos.TezosAddress>;
    function tezosGetPublicKey(
        params: P.CommonParams & Tezos.TezosGetPublicKey,
    ): P.Response<Tezos.TezosPublicKey>;
    function tezosGetPublicKey(
        params: P.CommonParams & P.Bundle<Tezos.TezosGetPublicKey>,
    ): P.BundledResponse<Tezos.TezosPublicKey>;
    function tezosSignTransaction(
        params: P.CommonParams & Tezos.TezosSignTransaction,
    ): P.Response<Protobuf.TezosSignedTx>;

    /**
     * Challenge-response authentication via Trezor.
     * To protect against replay attacks you should use a server-side generated
     * and randomized challengeHidden for every attempt. You can also provide a
     * visual challenge that will be shown on the device.
     */
    function requestLogin(
        params: P.CommonParams & (Misc.RequestLoginAsync | Misc.LoginChallenge),
    ): P.Response<Misc.Login>;

    /**
     * Asks device to encrypt value using the private key derived by given BIP32
     * path and the given key. IV is always computed automatically.
     */
    function cipherKeyValue(
        params: P.CommonParams & Misc.CipherKeyValue,
    ): P.Response<Misc.CipheredValue>;
    function cipherKeyValue(
        params: P.CommonParams & P.Bundle<Misc.CipherKeyValue>,
    ): P.BundledResponse<Misc.CipheredValue>;

    /**
     * Retrieves the set of features associated with the device.
     */
    function getFeatures(params?: P.CommonParams): P.Response<Device.Features>;

    /**
     * Retrieves device state associated with passphrase.
     */
    function getDeviceState(params?: P.CommonParams): P.Response<Device.DeviceStateResponse>;

    /**
     * Resets device to factory defaults and removes all private data.
     */
    function wipeDevice(params?: P.CommonParams): P.Response<P.DefaultMessage>;

    /**
     * Performs device setup and generates a new seed.
     */
    function resetDevice(params: P.CommonParams & Mgmnt.ResetDevice): P.Response<P.DefaultMessage>;

    /**
     * Applies device setup
     */
    function applySettings(
        params: P.CommonParams & Protobuf.ApplySettings,
    ): P.Response<P.DefaultMessage>;

    /**
     * Increment saved flag on device
     */
    function applyFlags(params: P.CommonParams & Mgmnt.ApplyFlags): P.Response<P.DefaultMessage>;

    /**
     * Change pin
     */
    function changePin(params: P.CommonParams & Mgmnt.ChangePin): P.Response<P.DefaultMessage>;

    /**
     * Sends FirmwareErase message followed by FirmwareUpdate message
     */
    function firmwareUpdate(
        params: P.CommonParams & Mgmnt.FirmwareUpdate,
    ): P.Response<P.DefaultMessage>;
    function firmwareUpdate(
        params: P.CommonParams & Mgmnt.FirmwareUpdateBinary,
    ): P.Response<P.DefaultMessage>;

    /**
     * Asks device to initiate seed backup procedure
     */
    function backupDevice(params?: P.CommonParams): P.Response<P.DefaultMessage>;

    /**
     * Ask device to initiate recovery procedure
     */
    function recoveryDevice(
        params: P.CommonParams & Mgmnt.RecoveryDevice,
    ): P.Response<P.DefaultMessage>;

    /**
     * Get static coin info
     */
    function getCoinInfo(params: CoinInfo.GetCoinInfo): P.Response<CoinInfo.CoinInfo>;

    /**
     * Reboots device (currently only T1 with fw >= 1.10.0) in bootloader mode
     */
    function rebootToBootloader(params?: P.CommonParams): P.Response<P.DefaultMessage>;

    /**
     * Set tor proxy for @trezor/blockchain-link connections
     */
    function setProxy(params: Misc.SetProxy): P.Response<Protobuf.Success>;

    // // Developer mode
    function customMessage(params: P.CommonParams & Misc.CustomMessage): P.Response<any>;
}
