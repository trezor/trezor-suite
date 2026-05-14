import styled, { useTheme } from 'styled-components';

import { Translation } from '@suite/intl';
import { isZero } from '@suite-common/wallet-utils';
import { Icon } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';
import {
    selectCurrentCoinjoinBalanceBreakdown,
    selectCurrentCoinjoinSession,
} from 'src/reducers/wallet/coinjoinReducer';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';

import { CryptoAmountWithHeader } from './CryptoAmountWithHeader';

const BalanceContainer = styled.div`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    align-self: normal;
    gap: 12px;
    padding: 0 10px;
`;

const StyledCryptoAmountWithHeader = styled(CryptoAmountWithHeader)`
    flex-grow: 1;
    max-width: 50%;
    margin-bottom: -4px;
`;

const PrivateBalanceHeading = styled.span`
    color: ${({ theme }) => theme.contentBrand};
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
                return <Icon name="pause" size={12} />;
            }

            return <Icon name="shuffle" size={15} />;
        }

        return <Icon name="x" size={15} />;
    };

    if (!currentAccount) {
        return null;
    }

    return (
        <BalanceContainer>
            <StyledCryptoAmountWithHeader
                header={getBalanceHeader()}
                headerIcon={getBalanceIcon()}
                value={notAnonymized}
                symbol={currentAccount?.symbol}
                color={!isZero(notAnonymized || '0') ? undefined : theme.contentSecondary}
            />

            <StyledCryptoAmountWithHeader
                header={
                    <PrivateBalanceHeading>
                        <Translation id="TR_PRIVATE" />
                    </PrivateBalanceHeading>
                }
                headerIcon={<Icon name="check" size={16} intent="brand" />}
                value={anonymized}
                symbol={currentAccount?.symbol}
                color={!isZero(anonymized || '0') ? theme.contentBrand : theme.contentSecondary}
            />
        </BalanceContainer>
    );
};
