import React, { useState } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';
import { H5, Button } from '@trezor/components';
import { changeAccountVisibility } from '@wallet-actions/accountActions';
import { changeCoinVisibility } from '@wallet-actions/settingsActions';
import { NETWORKS, EXTERNAL_NETWORKS } from '@wallet-config';
import { AppState, Dispatch, TrezorDevice } from '@suite-types';
import { Account, Network, ExternalNetwork } from '@wallet-types';
import l10nMessages from './messages';
import l10CommonMessages from '../messages';
import NetworkSelect from './components/NetworkSelect';
import AccountSelect from './components/AccountSelect';
import ExternalWallet from './components/ExternalWallet';

const Wrapper = styled.div`
    padding: 30px 48px;
    width: 420px;
    min-height: 320px;
`;

const StyledButton = styled(Button)`
    margin: 4px 0px;
    width: 100%;
`;

const mapStateToProps = (state: AppState) => ({
    accounts: state.wallet.accounts,
    enabledNetworks: state.wallet.settings.enabledNetworks,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    changeAccountVisibility: bindActionCreators(changeAccountVisibility, dispatch),
    changeCoinVisibility: bindActionCreators(changeCoinVisibility, dispatch),
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

    // Use component state, default value is first network item (btc)
    const [selectedSymbol, setSelectedNetwork] = useState(networks[0].symbol);
    // Find selected network
    const selectedNetwork = networks.find(n => n.symbol === selectedSymbol);

    return (
        <Wrapper>
            <H5>
                <FormattedMessage
                    {...l10nMessages.TR_ADD_NEW_ACCOUNT}
                    values={{ deviceLabel: props.device.label }}
                />
            </H5>
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
                }}
                onEnableNetwork={(symbol: string) => {
                    props.onCancel();
                    props.changeCoinVisibility(symbol, true, false);
                }}
            />
            <ExternalWallet selectedNetwork={selectedNetwork} onCancel={props.onCancel} />
            <StyledButton onClick={props.onCancel} isWhite>
                <FormattedMessage {...l10CommonMessages.TR_CANCEL} />
            </StyledButton>
        </Wrapper>
    );
};

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(AddAccount);
