/* @flow */
'use strict';

import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'react-router-redux';
import store, { history } from '../store';

import AppContainer from '../containers/AppContainer';
import { 
    CipherKeyValue,
    GetAccountInfo,
    GetAddress,
    GetPublicKey,
    SignMessage,
    VerifyMessage,
    EthereumGetAddress,
    EthereumSignTx,
    EthereumSignMessage,
    EthereumVerifyMessage,
    NEMGetAddress,
    NEMSignTx,
    StellarGetAddress,
    StellarSignTx,
    CustomMessage,
    ComposeTransaction,
    RequestLogin,
    SignTx
} from '../components/methods';

export default (
    <Provider store={ store }>
        <ConnectedRouter history={ history }>
            <Switch>
                <AppContainer>
                    <Route exact path="/" component={ GetPublicKey } />
                    <Route exact path="/cipherkv" component={ CipherKeyValue } />
                    <Route exact path="/signmessage" component={ SignMessage } />
                    <Route exact path="/verifymessage" component={ VerifyMessage } />
                    <Route exact path="/get-accountinfo" component={ GetAccountInfo } />
                    <Route exact path="/getaddress" component={ GetAddress } />
                    <Route exact path="/eth-getaddress" component={ EthereumGetAddress } />
                    <Route exact path="/eth-signtx" component={ EthereumSignTx } />
                    <Route exact path="/eth-signmessage" component={ EthereumSignMessage } />
                    <Route exact path="/eth-verifymessage" component={ EthereumVerifyMessage } />
                    <Route exact path="/nem-getaddress" component={ NEMGetAddress } />
                    <Route exact path="/nem-signtx" component={ NEMSignTx } />
                    <Route exact path="/stellar-signtx" component={ StellarSignTx } />
                    <Route exact path="/stellar-getaddress" component={ StellarGetAddress } />
                    <Route exact path="/custom" component={ CustomMessage } />
                    <Route exact path="/login" component={ RequestLogin } />
                    <Route exact path="/composetx" component={ ComposeTransaction } />
                    <Route exact path="/sign-tx" component={ SignTx } />
                </AppContainer>
            </Switch>
        </ConnectedRouter>
    </Provider>
);