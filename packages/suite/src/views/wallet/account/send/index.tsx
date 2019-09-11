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
                    value={send.address}
                    error={send.errors.address}
                    sendFormActions={sendFormActions}
                />
            </Row>
            <Row>
                <Amount
                    value={send.amount}
                    error={send.errors.amount}
                    sendFormActions={sendFormActions}
                />
            </Row>
            <Row>
                <Fee />
            </Row>
            <Row>
                <ButtonToggleAdditional
                    toggle={sendFormActions.toggleAdditionalFormVisibility}
                    isActive={send.isAdditionalFormVisible}
                />
            </Row>
            {send.isAdditionalFormVisible && (
                <Row>
                    <AdditionalForm networkType={network.networkType} />
                </Row>
            )}
            <SendAndClear errors={send.errors} clear={() => {}} send={() => {}} />
        </Layout>
    );
};

export default Send;
