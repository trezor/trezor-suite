/* @flow */

import React from 'react';
import { hot } from 'react-hot-loader';
import { Route, Switch } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'connected-react-router';
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
    EthereumGetPublicKey,
    EthereumSignTx,
    EthereumSignMessage,
    EthereumVerifyMessage,
    NEMGetAddress,
    NEMSignTx,
    RippleGetAddress,
    RippleSignTx,
    StellarGetAddress,
    StellarSignTx,
    CustomMessage,
    ComposeTransaction,
    RequestLogin,
    SignTx,
    PushTx,
    CardanoGetAddress,
    CardanoGetXpub,
    CardanoSignTx,
    LiskGetAddress,
    LiskGetXpub,
    LiskSignTx,
    LiskSignMessage,
    LiskVerifyMessage,
    TezosGetAddress,
    TezosGetXpub,
    TezosSignTx,
    ResetDevice,
    WipeDevice,
} from '../components/methods';

// export default (
const App = () => (
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
                    <Route exact path="/eth-getxpub" component={ EthereumGetPublicKey } />
                    <Route exact path="/eth-signtx" component={ EthereumSignTx } />
                    <Route exact path="/eth-signmessage" component={ EthereumSignMessage } />
                    <Route exact path="/eth-verifymessage" component={ EthereumVerifyMessage } />
                    <Route exact path="/nem-getaddress" component={ NEMGetAddress } />
                    <Route exact path="/nem-signtx" component={ NEMSignTx } />
                    <Route exact path="/ripple-signtx" component={ RippleSignTx } />
                    <Route exact path="/ripple-getaddress" component={ RippleGetAddress } />
                    <Route exact path="/stellar-signtx" component={ StellarSignTx } />
                    <Route exact path="/stellar-getaddress" component={ StellarGetAddress } />
                    <Route exact path="/custom" component={ CustomMessage } />
                    <Route exact path="/login" component={ RequestLogin } />
                    <Route exact path="/composetx" component={ ComposeTransaction } />
                    <Route exact path="/sign-tx" component={ SignTx } />
                    <Route exact path="/push-tx" component={ PushTx } />
                    <Route exact path="/cardano-getaddress" component={ CardanoGetAddress } />
                    <Route exact path="/cardano-getxpub" component={ CardanoGetXpub } />
                    <Route exact path="/cardano-signtx" component={ CardanoSignTx } />
                    <Route exact path="/lisk-getaddress" component={ LiskGetAddress } />
                    <Route exact path="/lisk-getxpub" component={ LiskGetXpub } />
                    <Route exact path="/lisk-signtx" component={ LiskSignTx } />
                    <Route exact path="/lisk-signmessage" component={ LiskSignMessage } />
                    <Route exact path="/lisk-verifymessage" component={ LiskVerifyMessage } />
                    <Route exact path="/tezos-getaddress" component={ TezosGetAddress } />
                    <Route exact path="/tezos-getxpub" component={ TezosGetXpub } />
                    <Route exact path="/tezos-signtx" component={ TezosSignTx } />
                    <Route exact path="/reset-device" component={ ResetDevice } />
                    <Route exact path="/wipe-device" component={ WipeDevice } />
                </AppContainer>
            </Switch>
        </ConnectedRouter>
    </Provider>
);

export default hot(module)(App);
// export default App;