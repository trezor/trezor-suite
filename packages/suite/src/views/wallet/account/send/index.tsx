import React from 'react';
import styled from 'styled-components';
import { InjectedIntl } from 'react-intl';

import { getTitleForNetwork } from '@wallet-utils/accountUtils';
import { StateProps, DispatchProps } from './Container';
import { Content, Title, LayoutAccount as Layout } from '@wallet-components';
import { Address, Amount, Fee, Buttons, AdditionalForm } from './components';

const Row = styled.div`
    padding: 0 0 20px 0;
`;

const Send = (props: { intl: InjectedIntl } & StateProps & DispatchProps) => {
    const { device, sendActions } = props;
    const { account, network, discovery, shouldRender } = props.selectedAccount;

    if (!device || !account || !discovery || !network || !shouldRender) {
        const { loader, exceptionPage } = props.selectedAccount;
        return (
            <Layout>
                <Content loader={loader} exceptionPage={exceptionPage} isLoading />
            </Layout>
        );
    }

    const id = `${account.network}-${account.accountType}-${account.index}`;

    return (
        <Layout>
            <Title>Send {getTitleForNetwork(network.symbol, props.intl)}</Title>
            <Row>
                <Address />
            </Row>
            <Row>
                <Amount />
            </Row>
            <Row>
                <Fee />
            </Row>
            <Row onClick={() => sendActions.toggleAdditionalFormVisibility()}>
                Click to show addition form
            </Row>
            {props.send.isAdditionalFormVisible.includes(id) && (
                <Row>
                    <AdditionalForm networkType={network.networkType} />
                </Row>
            )}
            <Buttons />
        </Layout>
    );
};

export default Send;
