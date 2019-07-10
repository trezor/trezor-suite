import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import * as TokenActions from '@wallet-actions/tokenActions';

import { AppState, Dispatch } from '@suite-types/index';
import Summary from './index';

const mapStateToProps = (state: AppState) => ({
    // TODO get selectedAccount from reducers
    selectedAccount: {
        tokens: [],
        pending: [],
        network: {
            order: 2,
            type: 'ethereum',
            name: 'Ethereum',
            symbol: 'ETH',
            shortcut: 'eth',
            bip44: "m/44'/60'/0'/0",
            chainId: 1,
            defaultGasPrice: 64,
            defaultGasLimit: 21000,
            defaultGasLimitTokens: 200000,
            decimals: 18,
            tokens: './data/ethereumTokens.json',
            web3: ['wss://eth2.trezor.io/geth'],
            explorer: {
                tx: 'https://etherscan.io/tx/',
                address: 'https://etherscan.io/address/',
            },
            hasSignVerify: true,
        },
        shouldRender: true,
        account: {
            imported: false,
            index: 0,
            network: 'eth',
            deviceID: '4C7098C3D916B10FBCDCE8A0',
            deviceState: '7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f',
            accountPath: [2147483692, 2147483792, 2147483648, 0, 0],
            descriptor: 'rNaqKtKrMSwpwZSzRckPf7S96DkimjkF4H',
            balance: '0',
            availableBalance: '0',
            block: 47570989,
            transactions: 0,
            empty: true,
            networkType: 'ethereum',
            sequence: 0,
            reserve: '20',
        },
    },
    summary: state.wallet.summary,
    wallet: state.wallet,
    device: state.suite.device,
    tokens: state.wallet.tokens,
    fiat: state.wallet.fiat,
    localStorage: state.wallet.localStorage,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    addToken: bindActionCreators(TokenActions.add, dispatch),
    loadTokens: bindActionCreators(TokenActions.load, dispatch),
    removeToken: bindActionCreators(TokenActions.remove, dispatch),
});

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(Summary);
