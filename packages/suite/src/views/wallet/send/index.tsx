import React from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';
import { useIntl } from 'react-intl';
import { Card } from '@suite-components';
import { WalletLayout } from '@wallet-components';
import { useSendForm, SendContext } from '@wallet-hooks/useSendForm';

import Header from './components/Header';
import Outputs from './components/Outputs';
import Options from './components/Options';
import Fees from './components/Fees';
import TotalSent from './components/TotalSent';
import ReviewButton from './components/ReviewButton';
import Raw from './components/Raw';
import { AppState } from '@suite-types';
import { SendFormProps, UseSendFormProps } from '@wallet-types/sendForm';
import messages from '@suite/support/messages';

const StyledCard = styled(Card)`
    display: flex;
    flex-direction: column;
    margin-bottom: 25px;
    padding: 0;
`;

const mapStateToProps = (state: AppState): SendFormProps => ({
    selectedAccount: state.wallet.selectedAccount,
    fiat: state.wallet.fiat,
    localCurrency: state.wallet.settings.localCurrency,
    fees: state.wallet.fees,
    online: state.suite.online,
    sendRaw: state.wallet.send.sendRaw,
});

// inner component for selectedAccount.status = "loaded"
// separated to call `useSendForm` hook at top level
const SendLoaded = (props: UseSendFormProps) => {
    const intl = useIntl();

    const sendContextValues = useSendForm(props);
    return (
        <WalletLayout
            title={intl.formatMessage(messages.TR_NAV_SEND)}
            account={props.selectedAccount}
        >
            <SendContext.Provider value={sendContextValues}>
                <StyledCard customHeader={<Header />}>
                    <Outputs />
                    <Options />
                </StyledCard>
                <Fees />
                <TotalSent />
                <ReviewButton />
            </SendContext.Provider>
        </WalletLayout>
    );
};

const Send = (props: SendFormProps) => {
    const { selectedAccount } = props;
    const intl = useIntl();

    if (selectedAccount.status !== 'loaded') {
        return (
            <WalletLayout
                title={intl.formatMessage(messages.TR_NAV_SEND)}
                account={selectedAccount}
            />
        );
    }

    if (props.sendRaw) {
        return (
            <WalletLayout
                title={intl.formatMessage(messages.TR_NAV_SEND)}
                account={selectedAccount}
            >
                <Raw network={selectedAccount.network} />
            </WalletLayout>
        );
    }

    return <SendLoaded {...props} selectedAccount={selectedAccount} />;
};

export default connect(mapStateToProps)(Send);
