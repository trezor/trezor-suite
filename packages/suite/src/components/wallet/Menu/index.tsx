import React, { useState } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import styled from 'styled-components';

import { Loader, colors } from '@trezor/components-v2';
import { DISCOVERY } from '@wallet-actions/constants';
import * as modalActions from '@suite-actions/modalActions';
import * as discoveryActions from '@wallet-actions/discoveryActions';
import { sortByCoin } from '@wallet-utils/accountUtils';
import { AppState, Dispatch } from '@suite-types';
import { Account } from '@wallet-types';
import { Translation } from '@suite-components';
import AccountItem from './components/AccountItem/Container';
import AddAccountButton from './components/AddAccount';
import ToggleLegacyAccounts from './components/ToggleLegacyAccounts';
import messages from '@suite/support/messages';

const Wrapper = styled.div`
    height: auto;
`;

const TitleWrapper = styled.div`
    display: flex;
    justify-content: space-between;
    margin: 24px 0px 16px 0px;
    padding: 0px 12px;
`;

const TitleText = styled.div`
    display: flex;
    text-transform: uppercase;
    font-size: 16px;
    font-weight: 600;
    color: ${colors.BLACK50}
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

const Menu = ({ device, accounts, selectedAccount, getDiscoveryForDevice, openModal }: Props) => {
    const [legacyVisibleState, setLegacyVisibleState] = useState<State['legacyVisible']>(false);
    const discovery = getDiscoveryForDevice();
    if (!device || !discovery) {
        return (
            <TitleWrapper>
                <TitleText>
                    <Translation {...messages.TR_ACCOUNTS_MENU_TITLE} />
                </TitleText>{' '}
                <TitleActions>
                    <Loader size={16} />
                </TitleActions>
            </TitleWrapper>
        );
    }

    const discoveryIsRunning = discovery.status <= DISCOVERY.STATUS.STOPPING;
    const failed: any[] = discovery.failed.map(f => ({
        ...f,
        path: 'path',
        descriptor: f.index + f.symbol + f.accountType,
        visible: true,
        balance: '0',
        availableBalance: '0',
        formattedBalance: '0',
    }));

    const list = sortByCoin(accounts.filter(a => a.deviceState === device.state).concat(failed));
    // always show first "normal" account even if they are empty
    const normalAccounts = list.filter(
        a => a.accountType === 'normal' && (a.index === 0 || !a.empty || a.visible),
    );
    const legacyAccounts = list.filter(a => a.accountType !== 'normal' && (!a.empty || a.visible));
    const legacyHasBalance = legacyAccounts.find(a => a.availableBalance !== '0');

    const isSelected = (account: Account) => {
        if (selectedAccount.account) {
            return selectedAccount.account === account;
        }
        return false;
    };

    let legacyVisible =
        legacyAccounts.length < 5 || discoveryIsRunning || !!legacyHasBalance || legacyVisibleState;
    if (!legacyVisible) {
        const legacyAccountIsSelected = legacyAccounts.find(a => isSelected(a));
        legacyVisible = !!legacyAccountIsSelected;
    }

    // TODO: add more cases when adding account is not possible
    const addAccountDisabled = !device.connected || device.authConfirm || device.authFailed;

    return (
        <Wrapper>
            <TitleWrapper>
                <TitleText>
                    <Translation {...messages.TR_ACCOUNTS_MENU_TITLE} />
                </TitleText>{' '}
                <TitleActions>
                    {discoveryIsRunning && <Loader size={16} />}
                    {!discoveryIsRunning && (
                        <AddAccountButton
                            onClick={() =>
                                openModal({
                                    type: 'add-account',
                                    device,
                                })
                            }
                            disabled={addAccountDisabled}
                            tooltipContent={<Translation {...messages.TR_ADD_ACCOUNT} />}
                        />
                    )}
                </TitleActions>
            </TitleWrapper>
            {normalAccounts.map(account => (
                <AccountItem
                    account={account}
                    selected={isSelected(account)}
                    key={`${account.descriptor}-${account.symbol}`}
                />
            ))}
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
