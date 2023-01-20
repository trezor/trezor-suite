import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { Card } from '@suite-components';
import { useSelector } from '@suite-hooks';
import {
    pauseCoinjoinSession,
    restoreCoinjoinSession,
} from '@wallet-actions/coinjoinAccountActions';
import { WalletLayout } from '@wallet-components';
import { useSendForm, SendContext, UseSendFormProps } from '@wallet-hooks/useSendForm';
import { selectCoinjoinAccountByKey } from '@wallet-reducers/coinjoinReducer';
import { Header } from './components/Header';
import Outputs from './components/Outputs';
import Options from './components/Options';
import { SendFees } from './components/Fees';
import { TotalSent } from './components/TotalSent';
import { ReviewButton } from './components/ReviewButton';
import Raw from './components/Raw';

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
    const [isCoinjoinPausedAutomatically, setIsCoinjoinPausedAutomatically] = useState(false);

    const coinjoinAccount = useSelector(state =>
        selectCoinjoinAccountByKey(state, props.selectedAccount.account.key),
    );

    const dispatch = useDispatch();

    const sendContextValues = useSendForm({ ...props, coinjoinAccount });

    const accountKey = props.selectedAccount.account.key;
    const accountType = props.selectedAccount.account?.accountType;
    const isSessionPaused = coinjoinAccount?.session?.paused;

    // pause coinjoin when send form is open to avoid changing UTXOs while preparing transaction or breaking a coinjoin round
    // automatically resume coinjoin upon leaving the send form
    useEffect(() => {
        if (accountType === 'coinjoin' && !isSessionPaused && !isCoinjoinPausedAutomatically) {
            dispatch(pauseCoinjoinSession(accountKey));
            setIsCoinjoinPausedAutomatically(true);
        }
        return () => {
            if (isCoinjoinPausedAutomatically && isSessionPaused) {
                dispatch(restoreCoinjoinSession(accountKey));
            }
        };
    }, [accountKey, accountType, dispatch, isCoinjoinPausedAutomatically, isSessionPaused]);

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
