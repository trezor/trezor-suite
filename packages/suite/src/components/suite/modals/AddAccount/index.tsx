import React, { useState } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';
import { H4 } from '@trezor/components';
import { changeAccountVisibility } from '@wallet-actions/accountActions';
import { changeCoinVisibility } from '@wallet-actions/settingsActions';
import * as routerActions from '@suite-actions/routerActions';
import { NETWORKS, EXTERNAL_NETWORKS } from '@wallet-config';
import { AppState, Dispatch, TrezorDevice } from '@suite-types';
import { Account, Network, ExternalNetwork } from '@wallet-types';
import l10nMessages from './messages';
import NetworkSelect from './components/NetworkSelect';
import AccountSelect from './components/AccountSelect';
import ExternalWallet from './components/ExternalWallet';

const Wrapper = styled.div`
    padding: 40px 50px;
    width: 420px;
`;

const mapStateToProps = (state: AppState) => ({
    accounts: state.wallet.accounts,
    enabledNetworks: state.wallet.settings.enabledNetworks,
    router: state.router,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    changeAccountVisibility: bindActionCreators(changeAccountVisibility, dispatch),
    changeCoinVisibility: bindActionCreators(changeCoinVisibility, dispatch),
    goto: bindActionCreators(routerActions.goto, dispatch),
});

type Props = {
    device: TrezorDevice;
    onCancel: () => void;
} & ReturnType<typeof mapStateToProps> &
    ReturnType<typeof mapDispatchToProps>;

type NetworkUnion = (Network | ExternalNetwork)[];

const AddAccount = (props: Props) => {
    // Collect all Networks without "accountType" (normal) and join ExternalNetworks
    const internalNetworks = NETWORKS.filter(n => !n.accountType && !n.isHidden) as NetworkUnion;
    const externalNetworks = EXTERNAL_NETWORKS.filter(n => !n.isHidden) as NetworkUnion;
    const networks = internalNetworks.concat(externalNetworks);

    // Collect accounts for selected device
    const accounts = props.accounts.filter(a => a.deviceState === props.device.state);

    // Use component state, default value is currently selected network or first network item on the list (btc)
    const { params } = props.router;
    let preselectedNetwork;
    if (props.router.app === 'wallet' && params) {
        preselectedNetwork = networks.find(n => n.symbol === params.symbol);
    }
    const [selectedSymbol, setSelectedNetwork] = useState(
        preselectedNetwork ? preselectedNetwork.symbol : networks[0].symbol,
    );
    // Find selected network (from component state value)
    const selectedNetwork = networks.find(n => n.symbol === selectedSymbol);

    return (
        <Wrapper>
            <H4>
                <FormattedMessage
                    {...l10nMessages.TR_ADD_NEW_ACCOUNT}
                    values={{ deviceLabel: props.device.label }}
                />
            </H4>
            <NetworkSelect
                selectedNetwork={selectedNetwork}
                networks={networks}
                setSelectedNetwork={setSelectedNetwork}
            />
            <AccountSelect
                selectedNetwork={selectedNetwork}
                enabledNetworks={props.enabledNetworks}
                accounts={accounts}
                onEnableAccount={(account: Account) => {
                    props.onCancel();
                    props.changeAccountVisibility(account);
                    props.goto('wallet-account-summary', {
                        symbol: account.symbol,
                        accountIndex: account.index,
                        accountType: account.accountType,
                    });
                }}
                onEnableNetwork={(symbol: string) => {
                    props.onCancel();
                    props.changeCoinVisibility(symbol, true, false);
                }}
            />
            <ExternalWallet selectedNetwork={selectedNetwork} onCancel={props.onCancel} />
        </Wrapper>
    );
};

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(AddAccount);
