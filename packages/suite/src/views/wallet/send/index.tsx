import React from 'react';
import styled from 'styled-components';
import { Card } from '@suite-components';
import { WalletLayout } from '@wallet-components';
import { useSendForm, SendContext } from '@wallet-hooks/useSendForm';
import { useSelector } from '@suite-hooks';

import Header from './components/Header';
import Outputs from './components/Outputs';
import Options from './components/Options';
import Fees from './components/Fees';
import TotalSent from './components/TotalSent';
import ReviewButton from './components/ReviewButton';
import Raw from './components/Raw';
import { UseSendFormProps } from '@wallet-types/sendForm';

const StyledCard = styled(Card)`
    display: flex;
    flex-direction: column;
    margin-bottom: 25px;
    padding: 0;
`;

// inner component for selectedAccount.status = "loaded"
// separated to call `useSendForm` hook at top level
// children are only for test purposes, this prop is not available in regular build
const SendLoaded: React.FC<UseSendFormProps> = ({ children, ...props }) => {
    const sendContextValues = useSendForm(props);

    return (
        <WalletLayout title="TR_NAV_SEND" account={props.selectedAccount}>
            <SendContext.Provider value={sendContextValues}>
                <Header />
                {!props.sendRaw && (
                    <>
                        <StyledCard>
                            <Outputs disableAnim={!!children} />
                            <Options />
                        </StyledCard>
                        <Fees />
                        <TotalSent />
                        <ReviewButton />
                        {children}
                    </>
                )}
            </SendContext.Provider>
            {props.sendRaw && <Raw network={props.selectedAccount.network} />}
        </WalletLayout>
    );
};

const Send: React.FC = ({ children }) => {
    const props = useSelector(state => ({
        selectedAccount: state.wallet.selectedAccount,
        fiat: state.wallet.fiat,
        localCurrency: state.wallet.settings.localCurrency,
        fees: state.wallet.fees,
        online: state.suite.online,
        sendRaw: state.wallet.send.sendRaw,
    }));

    const { selectedAccount } = props;

    if (selectedAccount.status !== 'loaded') {
        return <WalletLayout title="TR_NAV_SEND" account={selectedAccount} />;
    }

    /* children are only for test purposes, this prop is not available in regular build */
    return (
        <SendLoaded {...props} selectedAccount={selectedAccount}>
            {children}
        </SendLoaded>
    );
};

export default Send;
