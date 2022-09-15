import React from 'react';
import styled from 'styled-components';
import { useTheme } from '@trezor/components';
import { isZero } from '@suite-common/wallet-utils';
import { Translation } from '@suite-components/Translation';
import { CryptoAmountWithHeader } from '../CryptoAmountWithHeader';

const Container = styled.div<{ isSessionRunning: boolean }>`
    display: flex;
    justify-content: space-between;
    width: ${({ isSessionRunning }) => (isSessionRunning ? '100%' : '58%')};
    max-width: ${({ isSessionRunning }) => (isSessionRunning ? '480px' : '400px')};
`;

export const FundsPrivacyBreakdown = () => {
    const theme = useTheme();

    const notPrivateAmount = '0.00055';
    const anonymizingAmount = '0.0001';
    const privateAmount = '0.00003';

    const isSessionRunning = true;

    return (
        <Container isSessionRunning={isSessionRunning}>
            <CryptoAmountWithHeader
                header={<Translation id="TR_NOT_PRIVATE" />}
                headerIcon="CROSS"
                value={privateAmount}
                symbol="btc"
                color={!isZero(notPrivateAmount || '0') ? undefined : theme.TYPE_LIGHT_GREY}
            />

            {isSessionRunning && (
                <CryptoAmountWithHeader
                    header={<Translation id="TR_ANONYMIZING" />}
                    headerIcon="SHUFFLE"
                    value={anonymizingAmount}
                    symbol="btc"
                />
            )}

            <CryptoAmountWithHeader
                header={<Translation id="TR_PRIVATE" />}
                headerIcon="EYE_CLOSED"
                value={privateAmount}
                symbol="btc"
                color={!isZero(privateAmount || '0') ? theme.TYPE_GREEN : theme.TYPE_LIGHT_GREY}
            />
        </Container>
    );
};
