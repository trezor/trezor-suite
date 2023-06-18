import React from 'react';
import styled from 'styled-components';

import { Card } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { WalletLayout } from 'src/components/wallet';
import { useSendForm, SendContext, UseSendFormProps } from 'src/hooks/wallet/useSendForm';
import { Header } from './components/Header';
import Outputs from './components/Outputs';
import Options from './components/Options';
import { SendFees } from './components/Fees';
import { TotalSent } from './components/TotalSent';
import { ReviewButton } from './components/ReviewButton';
import Raw from './components/Raw';
import { selectCurrentTargetAnonymity } from 'src/reducers/wallet/coinjoinReducer';

const StyledCard = styled(Card)`
    display: flex;
    flex-direction: column;
    margin-bottom: 8px;
    padding: 0;
`;

interface SendLoadedProps extends UseSendFormProps {
    children?: React.ReactNode;
}

// inner component for selectedAccount.status = "loaded"
// separated to call `useSendForm` hook at top level
// children are only for test purposes, this prop is not available in regular build
const SendLoaded = ({ children, ...props }: SendLoadedProps) => {
    const sendContextValues = useSendForm({ ...props });

    return (
        <WalletLayout title="TR_NAV_SEND" account={props.selectedAccount}>
            <SendContext.Provider value={sendContextValues}>
                <Header />
                {!props.sendRaw && (
                    <>
                        <StyledCard data-test="@wallet/send/outputs-and-options">
                            <Outputs disableAnim={!!children} />
                            <Options />
                        </StyledCard>
                        <SendFees />
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

interface SendProps {
    children: React.ReactNode;
}

const Send = ({ children }: SendProps) => {
    const props = useSelector(state => ({
        fiat: state.wallet.fiat,
        localCurrency: state.wallet.settings.localCurrency,
        fees: state.wallet.fees,
        online: state.suite.online,
        sendRaw: state.wallet.send.sendRaw,
        metadataEnabled: state.metadata.enabled && !!state.metadata.provider,
        targetAnonymity: selectCurrentTargetAnonymity(state),
    }));
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);

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
