import React from 'react';
import styled from 'styled-components';
import { AppState } from '@suite/types/suite';
import { injectIntl, InjectedIntl } from 'react-intl';
import { connect } from 'react-redux';
import { getTitleForNetwork } from '@wallet-utils/accountUtils';

import { Content, Title, LayoutAccount as Layout } from '@wallet-components';
import { Address, Amount, Fee, Buttons, AdditionalForm } from './components';

const Row = styled.div`
    padding: 0 0 20px 0;
`;

const mapStateToProps = (state: AppState) => ({
    selectedAccount: state.wallet.selectedAccount,
    device: state.suite.device,
});

const mapDispatchToProps = () => ({});

type Props = { intl: InjectedIntl } & ReturnType<typeof mapStateToProps> &
    ReturnType<typeof mapDispatchToProps>;

const Send = (props: Props) => {
    const { device } = props;
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
                <Address />
            </Row>
            <Row>
                <Amount />
            </Row>
            <Row>
                <Fee />
            </Row>
            <Row>
                <AdditionalForm networkType={network.networkType} />
            </Row>
            <Buttons />
        </Layout>
    );
};

export default injectIntl(
    connect(
        mapStateToProps,
        mapDispatchToProps,
    )(Send),
);
