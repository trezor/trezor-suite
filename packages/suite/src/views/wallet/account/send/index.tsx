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
`;

const Send = (props: { intl: InjectedIntl } & StateProps & DispatchProps) => {
    const { device, sendFormActions, send } = props;
    const { account, network, discovery, shouldRender } = props.selectedAccount;

    if (!device || !account || !discovery || !network || !shouldRender) {
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
                    value={send.amount}
                    symbol={account.symbol}
                    error={send.errors.amount}
                    fiatValue={send.fiatValue}
                    localCurrency={send.localCurrency}
                    sendFormActions={sendFormActions}
                />
            </Row>
            <Row>
                <Fee />
            </Row>
            <Row>
                <ButtonToggleAdditional
                    isActive={send.isAdditionalFormVisible}
                    sendFormActions={sendFormActions}
                />
            </Row>
            {send.isAdditionalFormVisible && (
                <Row>
                    <AdditionalForm
                        sendFormActions={sendFormActions}
                        networkType={network.networkType}
                    />
                </Row>
            )}
            <SendAndClear
                amount={send.amount}
                address={send.address}
                errors={send.errors}
                symbol={network.symbol}
                sendFormActions={sendFormActions}
            />
        </Layout>
    );
};

export default Send;
