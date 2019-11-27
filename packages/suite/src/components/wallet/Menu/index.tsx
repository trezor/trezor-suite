import React, { useState } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Translation } from '@suite-components/Translation';
import styled from 'styled-components';
import { colors, variables, Loader } from '@trezor/components';
import * as accountActions from '@wallet-actions/accountActions';
import * as discoveryActions from '@wallet-actions/discoveryActions';
import { sortByCoin } from '@wallet-utils/accountUtils';
import { AppState, Dispatch } from '@suite-types';
import { Account } from '@wallet-types';
import Row from './components/Row';
import AddAccountButton from './components/AddAccount';
import ToggleLegacyAccounts from './components/ToggleLegacyAccounts';
import l10nMessages from './index.messages';
import walletAccountMessages from '@wallet-views/account/messages';

const Wrapper = styled.div``;

const LoadingWrapper = styled.div`
    display: flex;
    padding: 15px;
    justify-content: center;
    align-items: center;
`;

const LoadingText = styled.div`
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${colors.TEXT_SECONDARY};
    padding-left: 10px;
`;

const mapStateToProps = (state: AppState) => ({
    device: state.suite.device,
    accounts: state.wallet.accounts,
    selectedAccount: state.wallet.selectedAccount,
    hideBalance: state.wallet.settings.hideBalance,
    discovery: state.wallet.discovery,
    router: state.router,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    getDiscoveryForDevice: () => dispatch(discoveryActions.getDiscoveryForDevice()),
    requestNewAccount: bindActionCreators(accountActions.requestNewAccount, dispatch),
});

type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;
interface State {
    legacyVisible: boolean;
}

const DiscoveryStatus = () => (
    <Wrapper>
        <LoadingWrapper>
            <Loader size={15} />
            <LoadingText>
                <Translation {...walletAccountMessages.TR_LOADING_ACCOUNTS} />
                {/* todo: if you want dots "..." use Loader.Dots from onboarding */}
            </LoadingText>
        </LoadingWrapper>
    </Wrapper>
);

const Menu = ({
    device,
    accounts,
    selectedAccount,
    hideBalance,
    getDiscoveryForDevice,
    requestNewAccount,
}: Props) => {
    const [legacyVisibleState, setLegacyVisibleState] = useState<State['legacyVisible']>(false);
    const discovery = getDiscoveryForDevice();
    if (!device || !discovery) {
        return <DiscoveryStatus />;
    }
    const discoveryIsRunning = discovery.status <= 2;

    const list = sortByCoin(accounts.filter(a => a.deviceState === device.state));
    // always show first "normal" account even if they are empty
    const normalAccounts = list.filter(
        a => a.accountType === 'normal' && (a.index === 0 || !a.empty || a.visible),
    );
    const legacyAccounts = list.filter(a => a.accountType !== 'normal' && (!a.empty || a.visible));
    const legacyHasBalance = legacyAccounts.find(a => a.availableBalance !== '0');

    const isSelected = (account: Account) => {
        if (selectedAccount.account && selectedAccount.account === account) {
            return true;
        }
        return false;
    };

    let legacyVisible =
        legacyAccounts.length < 5 || discoveryIsRunning || !!legacyHasBalance || legacyVisibleState;
    if (!legacyVisible) {
        const legacyAccountIsSelected = legacyAccounts.find(a => isSelected(a));
        legacyVisible = !!legacyAccountIsSelected;
    }

    return (
        <Wrapper>
            {discoveryIsRunning && list.length === 0 && <DiscoveryStatus />}
            {normalAccounts.map(account => (
                <Row
                    account={account}
                    hideBalance={hideBalance}
                    selected={isSelected(account)}
                    key={`${account.descriptor}-${account.symbol}`}
                />
            ))}
            {discoveryIsRunning && list.length > 0 && <DiscoveryStatus />}
            {discovery.status === 4 && (
                <AddAccountButton
                    onClick={requestNewAccount}
                    tooltipContent={<Translation {...l10nMessages.TR_ADD_ACCOUNT} />}
                />
            )}
            {legacyAccounts.length > 0 && (
                <ToggleLegacyAccounts
                    onToggle={() => setLegacyVisibleState(!legacyVisible)}
                    isOpen={legacyVisible}
                />
            )}
            {legacyVisible &&
                legacyAccounts.map(account => (
                    <Row
                        account={account}
                        hideBalance={hideBalance}
                        selected={isSelected(account)}
                        key={`${account.descriptor}-${account.symbol}`}
                    />
                ))}
        </Wrapper>
    );
};

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(Menu);
