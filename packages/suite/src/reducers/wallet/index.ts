import { combineReducers } from 'redux';
import signVerifyReducer from './signVerifyReducer';
import settingsReducer from './settingsReducer';
import fiatRateReducer from './fiatRateReducer';
import transactionReducer from './transactionReducer';
import discoveryReducer from './discoveryReducer';
import accountsReducer from './accountsReducer';
import selectedAccountReducer from './selectedAccountReducer';
import receiveReducer from './receiveReducer';
import statusReducer from './statusReducer';

// import sendFormBitcoinReducer from './sendForm/bitcoinReducer';
// import sendFormEthereumReducer from './sendForm/ethereumReducer';
// import sendFormRippleReducer from './sendForm/rippleReducer';

const WalletReducers = combineReducers({
    signVerify: signVerifyReducer,
    fiat: fiatRateReducer,
    settings: settingsReducer,
    transactions: transactionReducer,
    discovery: discoveryReducer,
    accounts: accountsReducer,
    selectedAccount: selectedAccountReducer,
    receive: receiveReducer,
    status: statusReducer,
    // send form reducers
    // sendFormBitcoin: sendFormBitcoinReducer,
    // sendFormEthereum: sendFormEthereumReducer,
    // sendFormRipple: sendFormRippleReducer,
});

export default WalletReducers;
