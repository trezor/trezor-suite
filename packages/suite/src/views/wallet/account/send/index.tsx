import React from 'react';
import styled from 'styled-components';
import { InjectedIntl } from 'react-intl';
import { CoinLogo } from '@trezor/components';

import { getTitleForNetwork, getTypeForNetwork } from '@wallet-utils/accountUtils';
import { StateProps, DispatchProps } from './Container';
import { Content, Title, LayoutAccount as Layout } from '@wallet-components';
import {
    Address,
    Amount,
    Fee,
    SendAndClear,
    AdditionalForm,
    ButtonToggleAdditional,
} from './components';

const Row = styled.div`
    padding: 0 0 30px 0;
    display: flex;

    &:last-child {
        padding: 0;
    }

    flex-direction: ${(props: { isColumn?: boolean }) => (props.isColumn ? 'column' : 'row')};
`;

const StyledCoinLogo = styled(CoinLogo)`
    margin-right: 10px;
`;

const StyledTitle = styled(Title)`
    display: flex;
    align-items: center;
`;

const Send = (props: { intl: InjectedIntl } & StateProps & DispatchProps) => {
    const { device, sendFormActions, send, fees, fiat } = props;
    const { account, network, discovery, shouldRender } = props.selectedAccount;

    if (!device || !send || !account || !discovery || !network || !fees || !shouldRender) {
        const { loader, exceptionPage } = props.selectedAccount;
        return (
            <Layout>
                <Content loader={loader} exceptionPage={exceptionPage} isLoading />
            </Layout>
        );
    }

    const accountType = getTypeForNetwork(account.accountType, props.intl);

    return (
        <Layout>
            <StyledTitle>
                <StyledCoinLogo size={24} symbol={account.symbol} />
                Send {getTitleForNetwork(network.symbol, props.intl)}
                {accountType ? ` (${accountType})` : ''}
            </StyledTitle>
            <Row>
                <Address
                    address={send.address}
                    error={send.errors.address}
                    sendFormActions={sendFormActions}
                />
            </Row>
            <Row>
                <Amount
                    amount={send.amount}
                    canSetMax={(send.amount || 0) >= account.availableBalance}
                    symbol={account.symbol}
                    error={send.errors.amount}
                    fiatValue={send.fiatValue}
                    fiat={fiat}
                    localCurrency={send.localCurrency}
                    sendFormActions={sendFormActions}
                />
            </Row>
            <Row>
                <Fee fees={fees} sendFormActions={sendFormActions} symbol={network.symbol} />
            </Row>
            <Row isColumn={send.isAdditionalFormVisible}>
                <ButtonToggleAdditional
                    isActive={send.isAdditionalFormVisible}
                    sendFormActions={sendFormActions}
                />
                {send.isAdditionalFormVisible && (
                    <AdditionalForm networkType={network.networkType} />
                )}
                <SendAndClear
                    amount={send.amount}
                    address={send.address}
                    networkType={account.networkType}
                    errors={send.errors}
                    symbol={network.symbol}
                    sendFormActions={sendFormActions}
                />
            </Row>
        </Layout>
    );
};

export default Send;
