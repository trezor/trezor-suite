import { type SelectedAccountState } from '@suite/account';
import { Translation } from '@suite/intl';
import {
    selectIsStakingAccountActive,
    selectStakingAccountPositionEntry,
} from '@suite-common/earn-staking';
import { type NetworkSymbol, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { selectBaseCurrency } from '@suite-common/wallet-core';
import { isTestnet } from '@suite-common/wallet-utils';
import { Column, Icon, Paragraph, Row, Skeleton, Text } from '@trezor/components';
import { InfoIcon } from '@trezor/icons';
import { TokenIcon } from '@trezor/product-components';

import { AmountUnitSwitchWrapper } from '#src/components/suite/AmountUnitSwitchWrapper';
import { FormattedCryptoAmount } from '#src/components/suite/FormattedCryptoAmount';
import { FiatHeader } from '#src/components/wallet/FiatHeader';
import { useSelector } from '#src/hooks/suite/useSelector';
import { useAccountHeaderContext } from '#src/support/suite/AccountHeaderProvider';

type AccountOverviewBalanceSkeletonProps = {
    animate?: boolean;
    symbol?: NetworkSymbol;
};

const AccountOverviewBalanceSkeleton = ({
    animate,
    symbol,
}: AccountOverviewBalanceSkeletonProps) => (
    <Column gap={4}>
        <Skeleton width={100} height={50} animate={animate} />
        <Row gap={4}>
            {symbol ? (
                <TokenIcon size={16} networkSymbol={symbol} />
            ) : (
                <Skeleton type="circle" size={20} />
            )}
            <Skeleton height={20} animate={animate} />
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
    selectedAccount: SelectedAccountState;
};

export const AccountOverviewBalance = ({ selectedAccount }: AccountOverviewBalanceProps) => {
    const baseCurrency = useSelector(selectBaseCurrency);

    // A liquid delegation, as on Cardano, is the balance itself, so only a locked stake is excluded.
    const hasStakingExcludedFromBalance = useSelector(state => {
        if (!selectedAccount.account) return false;

        const positionEntry = selectStakingAccountPositionEntry(state, selectedAccount.account.key);

        return (
            positionEntry !== null &&
            positionEntry.position.lockup === 'locked' &&
            selectIsStakingAccountActive(state, selectedAccount.account.key)
        );
    });

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
    const hasTokens = !!account.tokens?.length;
    const balanceExcludesTranslationId = getBalanceExcludesTranslationId(
        hasTokens,
        hasStakingExcludedFromBalance,
    );

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
                                networkSymbol={symbol}
                            />
                        </Text>
                    )}
                </AmountUnitSwitchWrapper>
            </Column>
            {balanceExcludesTranslationId && (
                <Row gap={4}>
                    <Icon as={InfoIcon} size={16} intent="neutral" priority="secondary" />
                    <Paragraph intent="neutral" priority="secondary" typographyStyle="body-sm">
                        <Translation
                            id={balanceExcludesTranslationId}
                            values={{ networkDisplaySymbol: getNetworkDisplaySymbol(symbol) }}
                        />
                    </Paragraph>
                </Row>
            )}
        </Row>
    );
};
