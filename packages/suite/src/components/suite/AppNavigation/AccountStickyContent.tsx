import styled from 'styled-components';

import { CoinLogo, variables } from '@trezor/components';
import { Route } from '@suite-common/suite-types';

import {
    FiatValue,
    FormattedCryptoAmount,
    AccountLabeling,
    Translation,
} from 'src/components/suite';
import { Account } from 'src/types/wallet';
import { spacingsPx, typography } from '@trezor/theme';

const Main = styled.div`
    align-items: center;
    display: flex;
`;

const BalanceWrapperContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    margin: 0 0 0 13px;
`;

const Balance = styled.div`
    white-space: nowrap;
    font-size: ${variables.FONT_SIZE.SMALL};
    margin-left: ${spacingsPx.xxs};
`;

const FiatBalanceWrapper = styled.div`
    color: ${({ theme }) => theme.textSubdued};
    margin-left: 0.5ch;
`;

const LabelWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-start;
    ${typography.highlight}
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin: 0 13px 0 0;
`;

const BalanceInner = styled.div`
    display: flex;
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const StyledFiatValue = styled.div`
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const StyledFormTitle = styled.h3`
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

const StyledSeparator = styled.span`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: 31px;
    font-family: initial;
    display: inline-block;
    margin: -5px 0;
    padding: 0 8px;
    line-height: 1;
`;

interface AccountStickyContentProps {
    account?: Account;
    routeName: Route['name'];
}

export const AccountStickyContent = ({ account, routeName }: AccountStickyContentProps) => {
    if (!account) return null;

    const { symbol, formattedBalance } = account;

    const headerText = () => {
        if (!routeName) return;

        if (routeName === 'wallet-send') {
            return <Translation id="TR_NAV_SEND" />;
        }
        if (routeName === 'wallet-receive') {
            return <Translation id="TR_NAV_RECEIVE" />;
        }
        if (routeName.startsWith('wallet-coinmarket')) {
            return <Translation id="TR_NAV_TRADE" />;
        }
        if (routeName === 'wallet-sign-verify') {
            return <Translation id="TR_NAV_SIGN_VERIFY" />;
        }
        if (routeName === 'wallet-anonymize') {
            return <Translation id="TR_NAV_ANONYMIZE" />;
        }
    };

    return (
        <Main>
            <BalanceWrapperContainer>
                <LabelWrapper>
                    <StyledFormTitle>{headerText()}</StyledFormTitle>
                    <StyledSeparator>&#183;</StyledSeparator>
                    <AccountLabeling account={account} />
                </LabelWrapper>
                <BalanceInner>
                    <CoinLogo size={16} symbol={symbol} />
                    <Balance>
                        <FormattedCryptoAmount value={formattedBalance} symbol={symbol} />
                    </Balance>
                    <StyledFiatValue>
                        <FiatValue
                            amount={formattedBalance}
                            symbol={symbol}
                            showApproximationIndicator
                        >
                            {({ value }) =>
                                value ? <FiatBalanceWrapper>{value}</FiatBalanceWrapper> : null
                            }
                        </FiatValue>
                    </StyledFiatValue>
                </BalanceInner>
            </BalanceWrapperContainer>
        </Main>
    );
};
