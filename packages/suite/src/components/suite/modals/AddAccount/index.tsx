import React, { useState } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';
import { H5, Button } from '@trezor/components';
import { changeAccountVisibility } from '@wallet-actions/accountActions';
import { changeCoinVisibility } from '@wallet-actions/settingsActions';
import { AppState, Dispatch, TrezorDevice } from '@suite-types';
import { Account } from '@wallet-types';
import { NETWORKS } from '@suite-config';
import l10nMessages from './messages';
import l10CommonMessages from '../messages';
import NetworkSelect from './components/NetworkSelect';
import AccountSelect from './components/AccountSelect';

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

interface State {
    selectedSymbol: string;
}

const AddAccount = (props: Props) => {
    const networks = NETWORKS.filter(n => !n.accountType);
    const accounts = props.accounts.filter(a => a.deviceState === props.device.state);

    const [selectedSymbol, setSelectedNetwork] = useState<State['selectedSymbol']>(
        networks[0].symbol,
    );
    const selectedNetwork = NETWORKS.find(n => n.symbol === selectedSymbol && !n.accountType);

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
