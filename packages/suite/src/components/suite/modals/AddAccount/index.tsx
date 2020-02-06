import React, { useState } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import styled from 'styled-components';
import { Translation } from '@suite-components/Translation';
import { H2 } from '@trezor/components-v2';
import { changeAccountVisibility } from '@wallet-actions/accountActions';
import { changeCoinVisibility } from '@settings-actions/walletSettingsActions';
import * as routerActions from '@suite-actions/routerActions';
import { NETWORKS, EXTERNAL_NETWORKS } from '@wallet-config';
import { AppState, Dispatch, TrezorDevice } from '@suite-types';
import { Account, Network, ExternalNetwork } from '@wallet-types';
import ModalWrapper from '@suite-components/ModalWrapper';
import messages from '@suite/support/messages';
import NetworkSelect from './components/NetworkSelect';
import AccountSelect from './components/AccountSelect';
import ExternalWallet from './components/ExternalWallet';

const Wrapper = styled(ModalWrapper)`
    flex-direction: column;
    width: 420px;
`;

const mapStateToProps = (state: AppState) => ({
    accounts: state.wallet.accounts,
    enabledNetworks: state.wallet.settings.enabledNetworks,
    router: state.router,
    selectedAccount: state.wallet.selectedAccount,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    changeAccountVisibility: bindActionCreators(changeAccountVisibility, dispatch),
    changeCoinVisibility: bindActionCreators(changeCoinVisibility, dispatch),
    goto: bindActionCreators(routerActions.goto, dispatch),
});

type NetworkSymbol = Network['symbol'] | ExternalNetwork['symbol'];

type Props = {
    device: TrezorDevice;
    onCancel: () => void;
} & ReturnType<typeof mapStateToProps> &
    ReturnType<typeof mapDispatchToProps>;

const AddAccount = (props: Props) => {
    // Collect all Networks without "accountType" (normal)
    const internalNetworks = NETWORKS.filter(n => !n.accountType && !n.isHidden);
    const externalNetworks = EXTERNAL_NETWORKS.filter(n => !n.isHidden);

    // Collect accounts for selected device
    const accounts = props.accounts.filter(a => a.deviceState === props.device.state);

    // Use component state, default value is currently selected network or first network item on the list (btc)
    const { account } = props.selectedAccount;
    let preselectedNetwork;
    if (props.router.app === 'wallet' && account) {
        preselectedNetwork = internalNetworks.find(n => n.symbol === account.symbol);
    }
    const [selectedSymbol, setSelectedNetwork] = useState<NetworkSymbol>(
        preselectedNetwork ? preselectedNetwork.symbol : internalNetworks[0].symbol,
    );
    // Find selected network (from component state value)
    const selectedNetwork = [...internalNetworks, ...externalNetworks].find(
        n => n.symbol === selectedSymbol,
    );

    return (
        <Wrapper>
            <H2>
                <Translation
                    {...messages.TR_ADD_NEW_ACCOUNT}
                    values={{ deviceLabel: props.device.label }}
                />
            </H2>
            <NetworkSelect
                selectedNetwork={selectedNetwork}
                networks={internalNetworks}
                externalNetworks={externalNetworks}
                setSelectedNetwork={setSelectedNetwork}
            />
            <AccountSelect
                selectedNetwork={selectedNetwork}
                enabledNetworks={props.enabledNetworks}
                accounts={accounts}
                onEnableAccount={(account: Account) => {
                    props.onCancel();
                    props.changeAccountVisibility(account);
                    props.goto('wallet-index', {
                        symbol: account.symbol,
                        accountIndex: account.index,
                        accountType: account.accountType,
                    });
                }}
                onEnableNetwork={(symbol: Network['symbol']) => {
                    props.onCancel();
                    props.changeCoinVisibility(symbol, true);
                    props.goto('wallet-index', {
                        symbol,
                        accountIndex: 0,
                        accountType: 'normal',
                    });
                }}
            />
            <ExternalWallet selectedNetwork={selectedNetwork} onCancel={props.onCancel} />
        </Wrapper>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(AddAccount);
