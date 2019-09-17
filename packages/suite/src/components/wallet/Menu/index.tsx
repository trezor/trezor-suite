import React from 'react';
import { colors, variables, Loader } from '@trezor/components';
import styled from 'styled-components';
import { connect } from 'react-redux';
import * as discoveryActions from '@wallet-actions/discoveryActions';
import { sortByCoin } from '@wallet-utils/accountUtils';
import { AppState, Dispatch } from '@suite-types';
import Row from './components/Row';
import AddAccountButton from './components/AddAccount';

const Wrapper = styled.div``;

const LoadingWrapper = styled.div`
    display: flex;
    padding-top: 10px;
    justify-content: flex-start;
    align-items: center;
    padding-left: 20px;
`;

const LoadingText = styled.div`
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${colors.TEXT_SECONDARY};
    padding-left: 10px;
`;

const mapStateToProps = (state: AppState) => ({
    device: state.suite.device,
    accounts: state.wallet.accounts,
    hideBalance: state.wallet.settings.hideBalance,
    discovery: state.wallet.discovery,
    router: state.router,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    getDiscoveryForDevice: () => dispatch(discoveryActions.getDiscoveryForDevice()),
});

type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

const DiscoveryStatus = () => (
    <Wrapper>
        <LoadingWrapper>
            <Loader size={15} />
            <LoadingText>Loading accounts</LoadingText>
        </LoadingWrapper>
    </Wrapper>
);

const Menu = ({ device, accounts, hideBalance, getDiscoveryForDevice }: Props) => {
    const discovery = getDiscoveryForDevice();
    if (!device || !discovery) {
        return <DiscoveryStatus />;
    }
    const discoveryIsRunning = discovery.status <= 2;

    const list = sortByCoin(
        accounts.filter(
            a => a.deviceState === device.state && (!a.empty || (a.empty && a.visible)),
        ),
    );
    const normalAccounts = list.filter(a => a.accountType === 'normal');
    const legacyAccounts = list.filter(a => a.accountType !== 'normal');
    return (
        <Wrapper>
            {discoveryIsRunning && list.length === 0 && <DiscoveryStatus />}
            {normalAccounts.map(account => (
                <Row
                    account={account}
                    hideBalance={hideBalance}
                    key={`${account.descriptor}-${account.symbol}`}
                />
            ))}
            {legacyAccounts.length > 0 && (
                <LoadingWrapper>
                    <LoadingText>Legacy accounts (TODO: Fold it)</LoadingText>
                </LoadingWrapper>
            )}
            {legacyAccounts.map(account => (
                <Row
                    account={account}
                    hideBalance={hideBalance}
                    key={`${account.descriptor}-${account.symbol}`}
                />
            ))}
            {discoveryIsRunning && list.length > 0 && <DiscoveryStatus />}
            {discovery.status === 4 && <AddAccountButton />}
        </Wrapper>
    );
};

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(Menu);
