import { Translation } from '@suite/intl';
import { type NetworkSymbol, getNetworkFeatures } from '@suite-common/wallet-config';
import { selectBaseCurrency } from '@suite-common/wallet-core';
import { isTestnet } from '@suite-common/wallet-utils';
import {
    Column,
    Icon,
    Paragraph,
    Row,
    SkeletonCircle,
    SkeletonRectangle,
    Text,
} from '@trezor/components';
import { CoinLogo } from '@trezor/product-components';

import { AmountUnitSwitchWrapper, FormattedCryptoAmount } from 'src/components/suite';
import { FiatHeader } from 'src/components/wallet/FiatHeader';
import { useSelector } from 'src/hooks/suite';
import { useAccountHeaderContext } from 'src/support/suite/AccountHeaderProvider';
import { type AppState } from 'src/types/suite';

type AccountOverviewBalanceSkeletonProps = {
    animate?: boolean;
    symbol?: NetworkSymbol;
};

const AccountOverviewBalanceSkeleton = ({
    animate,
    symbol,
}: AccountOverviewBalanceSkeletonProps) => (
    <Column gap={4}>
        <SkeletonRectangle width={100} height={50} animate={animate} />
        <Row gap={4}>
            {symbol ? <CoinLogo size={16} symbol={symbol} /> : <SkeletonCircle size="20px" />}
            <SkeletonRectangle height={20} animate={animate} />
        </Row>
    </Column>
);

const getBalanceExcludesTranslationId = (hasTokens: boolean, hasStaking: boolean) => {
    if (hasTokens && hasStaking) return 'TR_BALANCE_EXCLUDES_TOKENS_AND_STAKING' as const;
    if (hasTokens) return 'TR_BALANCE_EXCLUDES_TOKENS' as const;
    if (hasStaking) return 'TR_BALANCE_EXCLUDES_STAKING' as const;

    return null;
};

type AccountOverviewBalanceProps = {
    selectedAccount: AppState['wallet']['selectedAccount'];
};

export const AccountOverviewBalance = ({ selectedAccount }: AccountOverviewBalanceProps) => {
    const baseCurrency = useSelector(selectBaseCurrency);
    const { balanceSectionRef } = useAccountHeaderContext();

    const { account, loader, status } = selectedAccount;

    if (status === 'exception') {
        return null;
    }

    if (status !== 'loaded' || !account) {
        return (
            <AccountOverviewBalanceSkeleton
                animate={loader === 'account-loading'}
                symbol={account?.symbol}
            />
        );
    }

    const { symbol, formattedBalance } = account;
    const shouldDisplayBaseCurrency = baseCurrency !== symbol;
    const isMainnet = !isTestnet(symbol);
    const features = getNetworkFeatures(symbol);
    const hasTokens = features.includes('tokens');
    const hasStaking = features.includes('staking');
    const balanceExcludesTranslationId = getBalanceExcludesTranslationId(hasTokens, hasStaking);

    return (
        <Row gap={16} justifyContent="space-between" alignItems="flex-end" flexWrap="wrap">
            <Column ref={balanceSectionRef}>
                {isMainnet && (
                    <FiatHeader
                        symbol={account.symbol}
                        amount={account.formattedBalance}
                        size="large"
                        localCurrency={baseCurrency}
                        data-testid="@wallet/account/fiat-amount"
                    />
                )}
                <AmountUnitSwitchWrapper symbol={symbol}>
                    {shouldDisplayBaseCurrency && (
                        <Text
                            intent="neutral"
                            typographyStyle="body-md"
                            priority="secondary"
                            as="div"
                        >
                            <FormattedCryptoAmount
                                data-testid="@wallet/account/crypto-balance"
                                value={formattedBalance}
                                symbol={symbol}
                            />
                        </Text>
                    )}
                </AmountUnitSwitchWrapper>
            </Column>
            {balanceExcludesTranslationId && (
                <Row gap={4}>
                    <Icon name="info" size={16} intent="neutral" priority="secondary" />
                    <Paragraph intent="neutral" priority="secondary" typographyStyle="body-sm">
                        <Translation id={balanceExcludesTranslationId} />
                    </Paragraph>
                </Row>
            )}
        </Row>
    );
};
