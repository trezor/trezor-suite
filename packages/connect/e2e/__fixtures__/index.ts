import applyFlags from './applyFlags';
import applySettings from './applySettings';
import binanceSignTransaction from './binanceSignTransaction';
import binanceGetPublicKey from './binanceGetPublicKey';
import binanceGetAddress from './binanceGetAddress';
import cardanoGetAddress from './cardanoGetAddress';
import cardanoGetAddressDerivations from './cardanoGetAddressDerivations';
import cardanoGetNativeScriptHash from './cardanoGetNativeScriptHash';
import cardanoGetPublicKey from './cardanoGetPublicKey';
import cardanoSignTransaction from './cardanoSignTransaction';
import composeTransaction from './composeTransaction';
import eosGetPublicKey from './eosGetPublicKey';
import eosSignTransaction from './eosSignTransaction';
import ethereumGetAddress from './ethereumGetAddress';
import ethereumGetPublicKey from './ethereumGetPublicKey';
import ethereumSignMessage from './ethereumSignMessage';
import ethereumSignTransaction from './ethereumSignTransaction';
import ethereumSignTransactionEip155 from './ethereumSignTransactionEip155';
import ethereumSignTransactionEip1559 from './ethereumSignTransactionEip1559';
import ethereumSignTypedData from './ethereumSignTypedData';
import ethereumVerifyMessage from './ethereumVerifyMessage';
import getAccountDescriptor from './getAccountDescriptor';
import getAccountInfo from './getAccountInfo';
import getAddress from './getAddress';
import getAddressMultisig from './getAddressMultisig';
import getAddressSegwit from './getAddressSegwit';
import getFeatures from './getFeatures';
import getFirmwareHash from './getFirmwareHash';
import getOwnershipId from './getOwnershipId';
import getOwnershipProof from './getOwnershipProof';
import getPublicKey from './getPublicKey';
import getPublicKeyBip48 from './getPublicKeyBip48';
import nemGetAddress from './nemGetAddress';
import nemSignTransactionMosaic from './nemSignTransactionMosaic';
import nemSignTransactionMultisig from './nemSignTransactionMultisig';
import nemSignTransactionOthers from './nemSignTransactionOthers';
import nemSignTransactionTransfer from './nemSignTransactionTransfer';
import rippleGetAddress from './rippleGetAddress';
import rippleSignTransaction from './rippleSignTransaction';
import signMessage from './signMessage';
import signTransaction from './signTransaction';
import signTransactionBcash from './signTransactionBcash';
import signTransactionBech32 from './signTransactionBech32';
import signTransactionBgold from './signTransactionBgold';
import signTransactionDash from './signTransactionDash';
import signTransactionDecred from './signTransactionDecred';
import signTransactionDoge from './signTransactionDoge';
import signTransactionExternal from './signTransactionExternal';
import signTransactionKomodo from './signTransactionKomodo';
import signTransactionMultisig from './signTransactionMultisig';
import signTransactionMultisigChange from './signTransactionMultisigChange';
import signTransactionPaymentRequest from './signTransactionPaymentRequest';
import signTransactionPeercoin from './signTransactionPeercoin';
import signTransactionReplace from './signTransactionReplace';
import signTransactionSegwit from './signTransactionSegwit';
import signTransactionTaproot from './signTransactionTaproot';
import signTransactionZcash from './signTransactionZcash';
import solanaGetAddress from './solanaGetAddress';
import solanaGetPublicKey from './solanaGetPublicKey';
import solanaSignTransaction from './solanaSignTransaction';
import stellarGetAddress from './stellarGetAddress';
import stellarSignTransaction from './stellarSignTransaction';
import tezosGetAddress from './tezosGetAddress';
import tezosGetPublicKey from './tezosGetPublicKey';
import tezosSignTransaction from './tezosSignTransaction';
import verifyMessage from './verifyMessage';
import verifyMessageSegwit from './verifyMessageSegwit';
import verifyMessageSegwitNative from './verifyMessageSegwitNative';

// TODO: add fixtures for missing dependencies https://github.com/trezor/trezor-suite/issues/5353
// backupDevice
// blockchainDisconnect
// blockchainEstimateFee
// blockchainGetAccountBalanceHistory
// blockchainGetFiatRates
// blockchainGetTransactions
// blockchainSetCustomBackend
// blockchainSubscribe
// blockchainSubscribeFiatRates
// blockchainUnsubscribe
// blockchainUnsubscribeFiatRates
// changePin
// cipherKeyValue
// firmwareUpdate
// getCoinInfo
// getDeviceState
// getSettings
// pushTransaction
// rebootToBootloader
// recoveryDevice
// requestLogin
// resetDevice
// setProxy
// tezosSignTransaction
// wipeDevice

let fixtures = [
    applyFlags,
    applySettings,
    binanceGetAddress,
    binanceGetPublicKey,
    binanceSignTransaction,
    cardanoGetAddress,
    cardanoGetAddressDerivations,
    cardanoGetNativeScriptHash,
    cardanoGetPublicKey,
    cardanoSignTransaction,
    composeTransaction,
    eosGetPublicKey,
    eosSignTransaction,
    ethereumGetAddress,
    ethereumGetPublicKey,
    ethereumSignMessage,
    ethereumSignTransaction,
    ethereumSignTransactionEip155,
    ethereumSignTransactionEip1559,
    ethereumSignTypedData,
    ethereumVerifyMessage,
    getAccountDescriptor,
    getAccountInfo,
    getAddress,
    getAddressMultisig,
    getAddressSegwit,
    getFeatures,
    getFirmwareHash,
    getOwnershipId,
    getOwnershipProof,
    getPublicKey,
    getPublicKeyBip48,
    nemGetAddress,
    nemSignTransactionMosaic,
    nemSignTransactionMultisig,
    nemSignTransactionOthers,
    nemSignTransactionTransfer,
    rippleGetAddress,
    rippleSignTransaction,
    signMessage,
    signTransaction,
    signTransactionBcash,
    signTransactionBech32,
    signTransactionBgold,
    signTransactionDash,
    signTransactionDecred,
    signTransactionDoge,
    signTransactionExternal,
    signTransactionKomodo,
    signTransactionMultisig,
    signTransactionMultisigChange,
    signTransactionPaymentRequest,
    signTransactionPeercoin,
    signTransactionReplace,
    signTransactionSegwit,
    signTransactionTaproot,
    signTransactionZcash,
    solanaGetAddress,
    solanaGetPublicKey,
    solanaSignTransaction,
    stellarGetAddress,
    stellarSignTransaction,
    tezosGetAddress,
    tezosGetPublicKey,
    tezosSignTransaction,
    verifyMessage,
    verifyMessageSegwit,
    verifyMessageSegwitNative,
];

const includedMethods = process.env.TESTS_INCLUDED_METHODS;
const excludedMethods = process.env.TESTS_EXCLUDED_METHODS;
if (includedMethods) {
    const methodsArr = includedMethods.split(',');
    fixtures = fixtures.filter(f => methodsArr.some(includedM => includedM === f.method));
} else if (excludedMethods) {
    const methodsArr = excludedMethods.split(',');
    fixtures = fixtures.filter(f => !methodsArr.includes(f.method));
}

// sort by mnemonic to avoid emu re-loading
const result = fixtures.sort((a, b) => {
    if (!a.setup.mnemonic || !b.setup.mnemonic) return 0;
    if (a.setup.mnemonic > b.setup.mnemonic) return 1;
    if (b.setup.mnemonic > a.setup.mnemonic) return -1;
    return 0;
});

export default result;
