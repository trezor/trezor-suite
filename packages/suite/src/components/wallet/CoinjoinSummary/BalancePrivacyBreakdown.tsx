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

export const BalanceContainer = styled.div<{ isSessionRunning: boolean }>`
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
    const { anonymized, notAnonymized } = useSelector(selectCurrentCoinjoinBalanceBreakdown);
    const currentSession = useSelector(selectCurrentCoinjoinSession);

    const theme = useTheme();

    const hasSession = !!currentSession;

    const getBalanceHeader = () => {
        if (hasSession) {
            if (currentSession.paused) {
                return <Translation id="TR_ANONYMIZATION_PAUSED" />;
            }

            return <Translation id="TR_ANONYMIZING" />;
        }

        return <Translation id="TR_NOT_PRIVATE" />;
    };

    const getBalanceIcon = () => {
        if (hasSession) {
            if (currentSession.paused) {
                return <Icon icon="PAUSE" size={12} />;
            }

            return <Icon icon="SHUFFLE" size={15} />;
        }

        return <Icon icon="CROSS" size={15} />;
    };

    if (!currentAccount) {
        return null;
    }

    return (
        <BalanceContainer isSessionRunning={isSessionRunning}>
            <CryptoAmountWithHeader
                header={getBalanceHeader()}
                headerIcon={getBalanceIcon()}
                value={notAnonymized}
                symbol={currentAccount?.symbol}
                color={!isZero(notAnonymized || '0') ? undefined : theme.TYPE_LIGHT_GREY}
            />

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
        </BalanceContainer>
    );
};
