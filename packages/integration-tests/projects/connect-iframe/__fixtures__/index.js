import applyFlags from './applyFlags';
import applySettings from './applySettings';
import getAddress from './getAddress';
import getAddressMultisig from './getAddressMultisig';
import getAddressSegwit from './getAddressSegwit';
import getPublicKey from './getPublicKey';
import rippleGetAddress from './rippleGetAddress';
import rippleSignTransaction from './rippleSignTransaction';
import binanceSignTransaction from './binanceSignTransaction';
// import cardanoGetAddress from './cardanoGetAddress';
import cardanoGetPublicKey from './cardanoGetPublicKey';
// import cardanoGetNativeScriptHash from './cardanoGetNativeScriptHash';
// import cardanoSignTransaction from './cardanoSignTransaction';
import composeTransaction from './composeTransaction';
import eosGetPublicKey from './eosGetPublicKey';
import eosSignTransaction from './eosSignTransaction';
// import ethereumGetAddress from './ethereumGetAddress';
// import ethereumGetPublicKey from './ethereumGetPublicKey';
// import ethereumSignMessage from './ethereumSignMessage';
// import ethereumSignTransaction from './ethereumSignTransaction';
// import ethereumSignTransactionEip155 from './ethereumSignTransactionEip155';
// import ethereumSignTransactionEip1559 from './ethereumSignTransactionEip1559';
// import ethereumSignTypedData from './ethereumSignTypedData';
// import ethereumVerifyMessage from './ethereumVerifyMessage';
import getAccountInfo from './getAccountInfo';
import getFeatures from './getFeatures';
import nemGetAddress from './nemGetAddress';
import nemSignTransactionMosaic from './nemSignTransactionMosaic';
import nemSignTransactionMultisig from './nemSignTransactionMultisig';
import nemSignTransactionOthers from './nemSignTransactionOthers';
import nemSignTransactionTransfer from './nemSignTransactionTransfer';
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
import signTransactionPeercoin from './signTransactionPeercoin';
import signTransactionReplace from './signTransactionReplace';
import signTransactionSegwit from './signTransactionSegwit';
import signTransactionZcash from './signTransactionZcash';
import stellarGetAddress from './stellarGetAddress';
// import stellarSignTransaction from './stellarSignTransaction';
import tezosGetAddress from './tezosGetAddress';
import tezosGetPublicKey from './tezosGetPublicKey';
import verifyMessage from './verifyMessage';
import verifyMessageSegwit from './verifyMessageSegwit';
import verifyMessageSegwitNative from './verifyMessageSegwitNative';

let fixtures = [
    applyFlags,
    applySettings,
    // todo: missing fixtures: BackupDevice.js
    // todo: missing fixtures: BinanceGetAddress.js
    // todo: missing fixtures: BinanceGetPublicKey.js
    binanceSignTransaction,
    // cardanoGetAddress,
    // cardanoGetNativeScriptHash,
    // cardanoGetPublicKey,
    // cardanoSignTransaction,
    // todo: missing fixtures: ChangePin.js
    // todo: missing fixtures: CipherKeyValue.js
    composeTransaction,
    // todo: missing fixtures: CustomMessage.js
    eosGetPublicKey,
    eosSignTransaction,
    // ethereumGetAddress,
    // ethereumGetPublicKey,
    // ethereumSignMessage,
    // ethereumSignTransaction,
    // ethereumSignTransactionEip155,
    // ethereumSignTransactionEip1559,
    // ethereumSignTypedData,
    // ethereumVerifyMessage,
    // todo: probably no way todo: FirmwareUpdate.js
    // todo: ripple worker problem
    getAccountInfo,
    getAddress,
    getAddressMultisig,
    getAddressSegwit,
    // todo: missing fixtures: GetDeviceState.js
    getFeatures,
    getPublicKey,
    // todo: missing fixtures: GetSettings.js
    nemGetAddress,
    nemSignTransactionMosaic,
    nemSignTransactionMultisig,
    nemSignTransactionOthers,
    nemSignTransactionTransfer,
    // todo: missing fixtures: PushTransaction.js
    // todo: missing fixtures: RecoveryDevice.js
    // todo: missing fixtures: RequestLogin.js
    // todo: missing fixtures: ResetDevice.js
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
    signTransactionPeercoin,
    signTransactionReplace,
    signTransactionSegwit,
    signTransactionZcash,
    stellarGetAddress,
    // stellarSignTransaction,
    tezosGetAddress,
    tezosGetPublicKey,
    verifyMessage,
    verifyMessageSegwit,
    verifyMessageSegwitNative,
    // todo: wipeDevice,
    // todo: resetDevice,
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
    if (a.setup.mnemonic > b.setup.mnemonic) return 1;
    if (b.setup.mnemonic > a.setup.mnemonic) return -1;
    return 0;
});

export default result;
