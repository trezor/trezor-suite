/* @flow */
'use strict';

import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';

import DOM from './DomReducer';
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

import custom from './methods/CustomMessageReducer';
import login from './methods/RequestLoginReducer';
import signtx from './methods/SignTxReducer';
import pushtx from './methods/PushTxReducer';

export default combineReducers({
    router: routerReducer,
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
    
    custom,
    login,
    signtx,
    pushtx
});