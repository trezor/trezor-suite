import React from 'react';
import styled from 'styled-components';
import { useTheme, Icon } from '@trezor/components';
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

const PrivateBalanceHeading = styled.span`
    color: ${({ theme }) => theme.TYPE_GREEN};
`;

// svg padding offset
const CheckIcon = styled(Icon)`
    width: 15px;
    height: 15px;
`;

export const BalancePrivacyBreakdown = () => {
    const currentAccount = useSelector(selectSelectedAccount);
    const { anonymized, anonymizing, notAnonymized } = useSelector(
        selectCurrentCoinjoinBalanceBreakdown,
    );
    const currentSession = useSelector(selectCurrentCoinjoinSession);

    const theme = useTheme();

    const isSessionRunning = !!currentSession;

    if (!currentAccount) {
        return null;
    }

    return (
        <Container isSessionRunning={isSessionRunning}>
            <CryptoAmountWithHeader
                header={<Translation id="TR_NOT_PRIVATE" />}
                headerIcon={<Icon icon="CROSS" size={15} />}
                value={notAnonymized}
                symbol={currentAccount?.symbol}
                color={!isZero(notAnonymized || '0') ? undefined : theme.TYPE_LIGHT_GREY}
            />

            {isSessionRunning && (
                <CryptoAmountWithHeader
                    header={<Translation id="TR_ANONYMIZING" />}
                    headerIcon={<Icon icon="SHUFFLE" size={15} />}
                    value={anonymizing}
                    symbol={currentAccount?.symbol}
                />
            )}

            <CryptoAmountWithHeader
                header={
                    <PrivateBalanceHeading>
                        <Translation id="TR_PRIVATE" />
                    </PrivateBalanceHeading>
                }
                headerIcon={<CheckIcon icon="CHECK" size={19} color={theme.TYPE_GREEN} />}
                value={anonymized}
                symbol={currentAccount?.symbol}
                color={!isZero(anonymized || '0') ? theme.TYPE_GREEN : theme.TYPE_LIGHT_GREY}
            />
        </Container>
    );
};
