import React from 'react';
import Content from '@wallet-components/Content';
import { AppState } from '@suite/types/suite';
import { injectIntl, InjectedIntl } from 'react-intl';
import { connect } from 'react-redux';
import Title from '@wallet-components/Title';
import { getTitleForNetwork } from '@wallet-utils/accountUtils';
import LayoutAccount from '@wallet-components/LayoutAccount';

import EthereumTypeSendForm from './ethereum';
import RippleTypeSendForm from './ripple';
import BitcoinTypeSendForm from './bitcoin';

const mapStateToProps = (state: AppState) => ({
    selectedAccount: state.wallet.selectedAccount,
    device: state.suite.device,
});

const mapDispatchToProps = () => ({});

type Props = {
    intl: InjectedIntl;
} & ReturnType<typeof mapStateToProps> &
    ReturnType<typeof mapDispatchToProps>;

const Send = (props: Props) => {
    const { device } = props;
    const { account, network, discovery, shouldRender } = props.selectedAccount;

    if (!device || !account || !discovery || !network || !shouldRender) {
        const { loader, exceptionPage } = props.selectedAccount;
        return (
            <LayoutAccount>
                <Content loader={loader} exceptionPage={exceptionPage} isLoading />
            </LayoutAccount>
        );
    }
    return (
        <LayoutAccount>
            <Title>Send {getTitleForNetwork(network.symbol, props.intl)}</Title>
            {network.networkType === 'bitcoin' && <BitcoinTypeSendForm />}
            {network.networkType === 'ethereum' && <EthereumTypeSendForm />}
            {network.networkType === 'ripple' && <RippleTypeSendForm />}
        </LayoutAccount>
    );
};

export default injectIntl(
    connect(
        mapStateToProps,
        mapDispatchToProps,
    )(Send),
);
