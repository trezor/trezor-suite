import styled from 'styled-components';

import { Context } from '@suite-common/message-system';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { selectBaseCurrency } from '@suite-common/wallet-core';
import { isTestnet } from '@suite-common/wallet-utils';
import { Column, SkeletonCircle, SkeletonRectangle } from '@trezor/components';
import { CoinLogo } from '@trezor/product-components';
import { spacingsPx, zIndices } from '@trezor/theme';

import { AmountUnitSwitchWrapper, FormattedCryptoAmount } from 'src/components/suite';
import { FiatHeader } from 'src/components/wallet/FiatHeader';
import { useSelector } from 'src/hooks/suite';
import { useAccountHeaderContext } from 'src/support/suite/AccountHeaderProvider';

import { ContextMessage } from '../AccountBanners/ContextMessage';

const Container = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${spacingsPx.xxs};
    width: 100%;
    padding-inline: ${spacingsPx.md};
    margin-top: ${spacingsPx.lg};
    z-index: ${zIndices.pageSubHeader};
`;

const AccountCryptoBalance = styled.div`
    display: flex;
    align-items: center;
    gap: ${spacingsPx.xxs};
    color: ${({ theme }) => theme.textSubdued};
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

export const AccountTopPanel = () => {
    const { account, loader, status } = useSelector(state => state.wallet.selectedAccount);
    const baseCurrency = useSelector(selectBaseCurrency);
    const { balanceSectionRef } = useAccountHeaderContext();

    if (status === 'exception') {
        return null;
    }

    if (status !== 'loaded' || !account) {
        return (
            <AccountTopPanelSkeleton
                animate={loader === 'account-loading'}
                symbol={account?.symbol}
            />
        );
    }

    const { symbol, formattedBalance, accountType } = account;
    const shouldDisplayBaseCurrency = baseCurrency !== symbol;
    const isMainnet = !isTestnet(symbol);

    return (
        <Container>
            <Column ref={balanceSectionRef}>
                <AmountUnitSwitchWrapper symbol={symbol}>
                    {shouldDisplayBaseCurrency && (
                        <AccountCryptoBalance>
                            <FormattedCryptoAmount
                                data-testid="@wallet/account-top-panel/crypto-balance"
                                value={formattedBalance}
                                symbol={symbol}
                            />
                        </AccountCryptoBalance>
                    )}
                </AmountUnitSwitchWrapper>
                {isMainnet && (
                    <FiatHeader
                        symbol={account.symbol}
                        amount={account.formattedBalance}
                        size="large"
                        localCurrency={baseCurrency}
                        data-testid="@wallet/account-top-panel/fiat-amount"
                    />
                )}
            </Column>
            <ContextMessage context={Context.getAccount(symbol, accountType)} />
        </Container>
    );
};
