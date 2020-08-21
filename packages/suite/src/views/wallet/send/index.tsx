import React from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';

import { Card } from '@suite-components';
import { WalletLayout } from '@wallet-components';
import { useSendForm, SendContext } from '@wallet-hooks/useSendForm';

import Header from './components/Header';
import Outputs from './components/Outputs';
import Options from './components/Options';
import Fees from './components/Fees';
import TotalSent from './components/TotalSent';
import ReviewButton from './components/ReviewButton';
import { AppState } from '@suite-types';
import { SendFormProps } from '@wallet-types/sendForm';

const StyledCard = styled(Card)`
    display: flex;
    flex-direction: column;
    margin-bottom: 25px;
    padding: 0;
`;

const mapStateToProps = (state: AppState) => ({
    selectedAccount: state.wallet.selectedAccount,
    fiat: state.wallet.fiat,
    localCurrency: state.wallet.settings.localCurrency,
    fees: state.wallet.fees,
    online: state.suite.online,
});

const Send = (props: SendFormProps) => {
    const { selectedAccount } = props;
    if (selectedAccount.status !== 'loaded') {
        return <WalletLayout title="Send" account={selectedAccount} />;
    }

    // It's OK to call this hook conditionally
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const sendContextValues = useSendForm({ ...props, selectedAccount });
    return (
        <WalletLayout title="Send" account={selectedAccount}>
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

export default connect(mapStateToProps)(Send);
