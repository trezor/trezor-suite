/* @flow */
'use strict';

import { combineReducers } from 'redux';
import { connectRouter } from 'connected-react-router';

import DOM from './DOMReducer';
import connect from './TrezorConnectReducer';
import modal from './ModalReducer';

import common from './methods/CommonReducer';
import cipherkv from './methods/CipherKeyValueReducer';
import composetx from './methods/ComposeTxReducer';
import getxpub from './methods/GetXpubReducer';
import signmessage from './methods/SignMessageReducer';
import verifymessage from './methods/VerifyMessageReducer';
import getaccountinfo from './methods/GetAccountInfoReducer';
import getaddress from './methods/GetAddressReducer';

import ethgetaddress from './methods/EthereumGetAddressReducer';
import ethgetxpub from './methods/EthereumGetXpubReducer';
import ethsigntx from './methods/EthereumSignTxReducer';
import ethsignmessage from './methods/EthereumSignMessageReducer';
import ethverifymessage from './methods/EthereumVerifyMessageReducer';

import nemgetaddress from './methods/NEMGetAddressReducer';
import nemsigntx from './methods/NEMSignTxReducer';

import ripplegetaddress from './methods/RippleGetAddressReducer';
import ripplesigntx from './methods/RippleSignTxReducer';

import stellargetaddress from './methods/StellarGetAddressReducer';
import stellarsigntx from './methods/StellarSignTxReducer';

import cardanogetaddress from './methods/CardanoGetAddressReducer';
import cardanogetxpub from './methods/CardanoGetXpubReducer';
import cardanosigntx from './methods/CardanoSignTxReducer';

import liskgetaddress from './methods/LiskGetAddressReducer';
import liskgetxpub from './methods/LiskGetXpubReducer';
import lisksigntx from './methods/LiskSignTxReducer';
import lisksignmessage from './methods/LiskSignMessageReducer';
import liskverifymessage from './methods/LiskVerifyMessageReducer';

import tezosgetaddress from './methods/TezosGetAddressReducer';
import tezosgetxpub from './methods/TezosGetXpubReducer';
import tezossigntx from './methods/TezosSignTxReducer';

import custom from './methods/CustomMessageReducer';
import login from './methods/RequestLoginReducer';
import signtx from './methods/SignTxReducer';
import pushtx from './methods/PushTxReducer';

import resetdevice from './methods/ResetDeviceReducer';
import wipedevice from './methods/WipeDeviceReducer';

const reducers = {
    DOM,
    connect,
    modal,
    
    common,
    cipherkv,
    composetx,
    getxpub,
    signmessage,
    verifymessage,
    getaccountinfo,
    getaddress,

    ethgetaddress,
    ethgetxpub,
    ethsigntx,
    ethsignmessage,
    ethverifymessage,

    nemgetaddress,
    nemsigntx,

    ripplegetaddress,
    ripplesigntx,

    stellargetaddress,
    stellarsigntx,

    cardanogetaddress,
    cardanogetxpub,
    cardanosigntx,

    liskgetaddress,
    liskgetxpub,
    lisksigntx,
    lisksignmessage,
    liskverifymessage,

    tezosgetaddress,
    tezosgetxpub,
    tezossigntx,
    
    custom,
    login,
    signtx,
    pushtx,

    resetdevice,
    wipedevice,
};

export default (history: any) => combineReducers({
    ...reducers,
    router: connectRouter(history),
});
