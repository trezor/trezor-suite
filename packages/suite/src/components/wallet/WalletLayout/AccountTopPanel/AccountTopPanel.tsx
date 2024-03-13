import styled, { useTheme } from 'styled-components';
import { forwardRef } from 'react';

import { spacingsPx } from '@trezor/theme';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { CoinLogo, Icon, SkeletonCircle, SkeletonRectangle } from '@trezor/components';

import {
    FormattedCryptoAmount,
    AmountUnitSwitchWrapper,
    StakeAmountWrapper,
} from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { FiatHeader } from 'src/views/dashboard/components/FiatHeader';
import { selectLocalCurrency } from 'src/reducers/wallet/settingsReducer';
import { useFiatFromCryptoValue } from 'src/hooks/suite/useFiatFromCryptoValue';
import { STAKE_SYMBOLS } from 'src/constants/suite/ethStaking';
import { selectSelectedAccountAutocompoundBalance } from 'src/reducers/wallet/selectedAccountReducer';
import { mapTestnetSymbol } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { selectAccountStakeTransactions } from '@suite-common/wallet-core';

export const ACCOUNT_INFO_HEIGHT = 80;

const Container = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${spacingsPx.xxs};
    min-height: ${ACCOUNT_INFO_HEIGHT}px;
    width: 100%;
    padding-left: ${spacingsPx.md};
    padding-right: ${spacingsPx.md};
    margin-top: ${spacingsPx.lg};
`;

const AccountCryptoBalance = styled.div`
    display: flex;
    align-items: center;
    gap: ${spacingsPx.xxs};
    color: ${({ theme }) => theme.textSubdued};
`;

const AmountsWrapper = styled.div`
    display: flex;
    gap: ${spacingsPx.lg};
    flex-wrap: wrap;
`;

interface AccountTopPanelSkeletonProps {
    animate?: boolean;
    symbol?: NetworkSymbol;
}

const AccountTopPanelSkeleton = ({ animate, symbol }: AccountTopPanelSkeletonProps) => (
    <Container>
        <AccountCryptoBalance>
            {symbol ? <CoinLogo size={16} symbol={symbol} /> : <SkeletonCircle size="20px" />}
            <SkeletonRectangle height={20} animate={animate} />
        </AccountCryptoBalance>

        <SkeletonRectangle width={100} height={50} animate={animate} />
    </Container>
);

export const AccountTopPanel = forwardRef<HTMLDivElement>((_, ref) => {
    const theme = useTheme();
    const { account, loader, status } = useSelector(state => state.wallet.selectedAccount);
    const localCurrency = useSelector(selectLocalCurrency);
    const autocompoundBalance = useSelector(selectSelectedAccountAutocompoundBalance);
    const stakeTxs = useSelector(state =>
        selectAccountStakeTransactions(state, account?.key || ''),
    );

    const hasStaked = stakeTxs.length > 0;

    // TODO: move this to FiatHeader
    const { fiatAmount } = useFiatFromCryptoValue({
        amount: account?.formattedBalance || '',
        symbol: account?.symbol || '',
    });

    const mappedSymbol = account?.symbol ? mapTestnetSymbol(account?.symbol) : '';
    const { fiatAmount: fiatStakeAmount } = useFiatFromCryptoValue({
        amount: autocompoundBalance,
        symbol: mappedSymbol,
    });

    if (status !== 'loaded' || !account) {
        return (
            <AccountTopPanelSkeleton
                animate={loader === 'account-loading'}
                symbol={account?.symbol}
            />
        );
    }

    const { symbol, formattedBalance } = account;

    const isStakeShown = STAKE_SYMBOLS.includes(symbol) && hasStaked;

    return (
        <Container ref={ref}>
            <AmountsWrapper>
                <div>
                    <AmountUnitSwitchWrapper symbol={symbol}>
                        <AccountCryptoBalance>
                            <CoinLogo size={16} symbol={symbol} />

                            <FormattedCryptoAmount value={formattedBalance} symbol={symbol} />
                        </AccountCryptoBalance>
                    </AmountUnitSwitchWrapper>

                    <FiatHeader
                        size="large"
                        localCurrency={localCurrency}
                        fiatAmount={fiatAmount ?? '0'}
                    />
                </div>

                {isStakeShown && (
                    <div>
                        <StakeAmountWrapper>
                            <AccountCryptoBalance>
                                <Icon icon="PIGGY_BANK" color={theme.TYPE_DARK_GREY} size={16} />

                                <FormattedCryptoAmount
                                    value={autocompoundBalance}
                                    symbol={symbol}
                                />
                            </AccountCryptoBalance>
                        </StakeAmountWrapper>

                        <FiatHeader
                            size="large"
                            localCurrency={localCurrency}
                            fiatAmount={fiatStakeAmount ?? '0'}
                        />
                    </div>
                )}
            </AmountsWrapper>
        </Container>
    );
});
