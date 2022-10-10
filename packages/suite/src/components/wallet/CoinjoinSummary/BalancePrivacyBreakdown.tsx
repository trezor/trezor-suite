import React from 'react';
import styled from 'styled-components';
import { useTheme } from '@trezor/components';
import { isZero } from '@suite-common/wallet-utils';
import { Translation } from '@suite-components/Translation';
import { useSelector } from '@suite-hooks';
import { CryptoAmountWithHeader } from '@wallet-components/PrivacyAccount/CryptoAmountWithHeader';
import {
    selectCurrentCoinjoinBalanceBreakdown,
    selectCurrentCoinjoinSession,
} from '@wallet-reducers/coinjoinReducer';
import { selectSelectedAccount } from '@wallet-reducers/selectedAccountReducer';

const Container = styled.div<{ isSessionRunning: boolean }>`
    display: flex;
    justify-content: space-between;
    width: ${({ isSessionRunning }) => (isSessionRunning ? '100%' : '58%')};
    max-width: ${({ isSessionRunning }) => (isSessionRunning ? '480px' : '400px')};
`;

export const BalancePrivacyBreakdown = () => {
    const currentAccount = useSelector(selectSelectedAccount);
    const balanceBreakdown = useSelector(selectCurrentCoinjoinBalanceBreakdown);
    const currentSession = useSelector(selectCurrentCoinjoinSession);

    const theme = useTheme();

    const notPrivateAmount = balanceBreakdown.notAnonymized;
    const privateAmount = balanceBreakdown.anonymized;

    const isSessionRunning = !!currentSession;

    if (!currentAccount) {
        return null;
    }

    return (
        <Container isSessionRunning={isSessionRunning}>
            <CryptoAmountWithHeader
                header={<Translation id="TR_NOT_PRIVATE" />}
                headerIcon="CROSS"
                value={notPrivateAmount}
                symbol={currentAccount?.symbol}
                color={!isZero(notPrivateAmount || '0') ? undefined : theme.TYPE_LIGHT_GREY}
            />

            {isSessionRunning && (
                <CryptoAmountWithHeader
                    header={<Translation id="TR_ANONYMIZING" />}
                    headerIcon="SHUFFLE"
                    value={balanceBreakdown.anonymizing}
                    symbol={currentAccount?.symbol}
                />
            )}

            <CryptoAmountWithHeader
                header={<Translation id="TR_PRIVATE" />}
                headerIcon="EYE_CLOSED"
                value={privateAmount}
                symbol={currentAccount?.symbol}
                color={!isZero(privateAmount || '0') ? theme.TYPE_GREEN : theme.TYPE_LIGHT_GREY}
            />
        </Container>
    );
};
