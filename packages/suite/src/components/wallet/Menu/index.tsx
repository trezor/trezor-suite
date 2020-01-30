import React, { useState } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Translation } from '@suite-components/Translation';
import styled from 'styled-components';
import { colors, variables, Loader } from '@trezor/components-v2';
import { DISCOVERY } from '@wallet-actions/constants';
import * as modalActions from '@suite-actions/modalActions';
import * as discoveryActions from '@wallet-actions/discoveryActions';
import { sortByCoin } from '@wallet-utils/accountUtils';
import { AppState, Dispatch } from '@suite-types';
import { Account } from '@wallet-types';
import AccountItem from './components/AccountItem/Container';
import AddAccountButton from './components/AddAccount';
import ToggleLegacyAccounts from './components/ToggleLegacyAccounts';
import messages from '@suite/support/messages';

const Wrapper = styled.div``;

const LoadingWrapper = styled.div`
    display: flex;
    padding: 15px;
    justify-content: center;
    align-items: center;
`;

const LoadingText = styled.div`
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${colors.BLACK50};
    padding-left: 10px;
`;

const TitleWrapper = styled.div`
    display: flex;
    justify-content: space-between;
    margin: 36px 0px 16px 0px;
    padding: 0px 12px;
`;

const TitleText = styled.div`
    display: flex;
    text-transform: uppercase;
    font-size: 16px;
    font-weight: 600;
    color: #808080;
`;

const TitleActions = styled.div`
    display: flex;
`;

const mapStateToProps = (state: AppState) => ({
    device: state.suite.device,
    accounts: state.wallet.accounts,
    selectedAccount: state.wallet.selectedAccount,
    discovery: state.wallet.discovery,
    router: state.router,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    getDiscoveryForDevice: () => dispatch(discoveryActions.getDiscoveryForDevice()),
    openModal: bindActionCreators(modalActions.openModal, dispatch),
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
                <Translation {...messages.TR_LOADING_ACCOUNTS} />
                {/* todo: if you want dots "..." use Loader.Dots from onboarding */}
            </LoadingText>
        </LoadingWrapper>
    </Wrapper>
);

const Menu = ({ device, accounts, selectedAccount, getDiscoveryForDevice, openModal }: Props) => {
    const [legacyVisibleState, setLegacyVisibleState] = useState<State['legacyVisible']>(false);
    const discovery = getDiscoveryForDevice();
    if (!device || !discovery) {
        return <DiscoveryStatus />;
    }
    const discoveryIsRunning = discovery.status <= DISCOVERY.STATUS.STOPPING;

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
            <TitleWrapper>
                <TitleText>Accounts</TitleText>{' '}
                <TitleActions>
                    <AddAccountButton
                        onClick={() =>
                            openModal({
                                type: 'add-account',
                                device,
                            })
                        }
                        disabled={discovery.status !== DISCOVERY.STATUS.COMPLETED}
                        tooltipContent={<Translation {...messages.TR_ADD_ACCOUNT} />}
                    />
                </TitleActions>
            </TitleWrapper>
            {discoveryIsRunning && list.length === 0 && <DiscoveryStatus />}
            {normalAccounts.map(account => (
                <AccountItem
                    account={account}
                    selected={isSelected(account)}
                    key={`${account.descriptor}-${account.symbol}`}
                />
            ))}
            {discoveryIsRunning && list.length > 0 && <DiscoveryStatus />}
            {legacyAccounts.length > 0 && (
                <ToggleLegacyAccounts
                    onToggle={() => setLegacyVisibleState(!legacyVisible)}
                    isOpen={legacyVisible}
                />
            )}
            {legacyVisible &&
                legacyAccounts.map(account => (
                    <AccountItem
                        account={account}
                        selected={isSelected(account)}
                        key={`${account.descriptor}-${account.symbol}`}
                    />
                ))}
        </Wrapper>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(Menu);
