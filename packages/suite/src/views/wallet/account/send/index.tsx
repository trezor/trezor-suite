import React from 'react';
import styled from 'styled-components';
import { InjectedIntl } from 'react-intl';

import { getTitleForNetwork } from '@wallet-utils/accountUtils';
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
`;

const RowColumn = styled(Row)`
    flex-direction: column;
`;

const Send = (props: { intl: InjectedIntl } & StateProps & DispatchProps) => {
    const { device, sendFormActions, send, fees } = props;
    const { account, network, discovery, shouldRender } = props.selectedAccount;

    if (!device || !send || !account || !discovery || !network || !fees || !shouldRender) {
        const { loader, exceptionPage } = props.selectedAccount;
        return (
            <Layout>
                <Content loader={loader} exceptionPage={exceptionPage} isLoading />
            </Layout>
        );
    }

    return (
        <Layout>
            <Title>Send {getTitleForNetwork(network.symbol, props.intl)}</Title>
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
                    canSetMax={(send.amount || 0) > account.availableBalance}
                    symbol={account.symbol}
                    error={send.errors.amount}
                    fiatValue={send.fiatValue}
                    localCurrency={send.localCurrency}
                    sendFormActions={sendFormActions}
                />
            </Row>
            <Row>
                <Fee fees={fees} sendFormActions={sendFormActions} symbol={network.symbol} />
            </Row>
            {!send.isAdditionalFormVisible && (
                <Row>
                    <ButtonToggleAdditional
                        isActive={send.isAdditionalFormVisible}
                        sendFormActions={sendFormActions}
                    />
                    <SendAndClear
                        amount={send.amount}
                        address={send.address}
                        errors={send.errors}
                        symbol={network.symbol}
                        sendFormActions={sendFormActions}
                    />
                </Row>
            )}
            {send.isAdditionalFormVisible && (
                <RowColumn>
                    <ButtonToggleAdditional
                        isActive={send.isAdditionalFormVisible}
                        sendFormActions={sendFormActions}
                    />
                    <AdditionalForm networkType={network.networkType} />
                    <SendAndClear
                        amount={send.amount}
                        address={send.address}
                        errors={send.errors}
                        symbol={network.symbol}
                        sendFormActions={sendFormActions}
                    />
                </RowColumn>
            )}
        </Layout>
    );
};

export default Send;
