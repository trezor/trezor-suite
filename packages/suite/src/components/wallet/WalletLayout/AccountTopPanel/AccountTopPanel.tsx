import { forwardRef } from 'react';

import styled from 'styled-components';

import { spacingsPx } from '@trezor/theme';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { SkeletonCircle, SkeletonRectangle } from '@trezor/components';
import { CoinLogo } from '@trezor/product-components';

import { FormattedCryptoAmount, AmountUnitSwitchWrapper } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { FiatHeader } from 'src/components/wallet/FiatHeader';
import { selectLocalCurrency } from 'src/reducers/wallet/settingsReducer';

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
    const { account, loader, status } = useSelector(state => state.wallet.selectedAccount);
    const localCurrency = useSelector(selectLocalCurrency);

    if (status !== 'loaded' || !account) {
        return (
            <AccountTopPanelSkeleton
                animate={loader === 'account-loading'}
                symbol={account?.symbol}
            />
        );
    }

    const { symbol, formattedBalance } = account;

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
                        symbol={account.symbol}
                        amount={account.formattedBalance}
                        size="large"
                        localCurrency={localCurrency}
                    />
                </div>
            </AmountsWrapper>
        </Container>
    );
});
