import { memo } from 'react';
import { useSelector } from 'react-redux';

import { selectIsPortfolioTrackerDevice } from '@suite-common/device';
import { type TokenDefinitionsRootState } from '@suite-common/token-definitions';
import {
    type AccountsRootState,
    type TransactionsRootState,
    selectAccountByKey,
    selectIsTestnetAccount,
    useDisplayBaseCurrency,
} from '@suite-common/wallet-core';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { Box, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    type TokensRootState,
    selectAccountTokenInfo,
    selectIsUnrecognizedToken,
} from '@suite-native/tokens';
import { selectHasAccountAnyTransactionsForToken } from '@suite-native/transactions';

import { AccountDiscoveryFailedBanner } from './AccountBanners/AccountDiscoveryFailedBanner';
import { SolanaLimitedHistoryBanner } from './AccountBanners/SolanaLimitedHistoryBanner';
import { StellarLimitedHistoryBanner } from './AccountBanners/StellarLimitedHistoryBanner';
import { AccountDetailActionButtons } from './AccountDetailActionButtons';
import { AccountDetailGraph } from './AccountDetailGraph';
import { AssetPriceCard } from './AssetPriceCard';
import { StellarTokenActions } from './StellarTokenActions';
import { TronResources } from './TronResources';
import { YieldVaultBanner } from './YieldVaultBanner';
import { YourPositionCard } from './YourPositionCard';

type TransactionListHeaderProps = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
};

type TransactionListHeaderContentProps = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
};

const TransactionListHeaderContent = ({
    accountKey,
    tokenContract,
}: TransactionListHeaderContentProps) => {
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const hasAccountTransactions = useSelector((state: AccountsRootState & TransactionsRootState) =>
        selectHasAccountAnyTransactionsForToken(state, accountKey, tokenContract),
    );
    const isTestnetAccount = useSelector((state: AccountsRootState) =>
        selectIsTestnetAccount(state, accountKey),
    );
    const isUnrecognizedToken = useSelector(
        (state: TokenDefinitionsRootState & AccountsRootState) =>
            selectIsUnrecognizedToken(state, accountKey, tokenContract),
    );

    if (!account) return null;

    const isGraphDisplayed = hasAccountTransactions && !isTestnetAccount && !isUnrecognizedToken;

    if (!isGraphDisplayed) return null;

    return <AccountDetailGraph accountKey={accountKey} tokenContract={tokenContract} />;
};

export const TransactionListHeader = memo(
    ({ accountKey, tokenContract }: TransactionListHeaderProps) => {
        const account = useSelector((state: AccountsRootState) =>
            selectAccountByKey(state, accountKey),
        );
        const { shallDisplayBaseCurrency } = useDisplayBaseCurrency(account?.symbol);

        const hasSelectedAssetTransactions = useSelector(
            (state: AccountsRootState & TransactionsRootState) =>
                selectHasAccountAnyTransactionsForToken(state, accountKey, tokenContract),
        );
        const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);
        const token = useSelector((state: TokensRootState) =>
            selectAccountTokenInfo(state, accountKey, tokenContract),
        );
        const isUnrecognizedToken = useSelector(
            (state: TokenDefinitionsRootState & AccountsRootState) =>
                selectIsUnrecognizedToken(state, accountKey, tokenContract),
        );

        if (!account) return null;

        const isPriceCardDisplayed =
            shallDisplayBaseCurrency && !isUnrecognizedToken && hasSelectedAssetTransactions;
        const isStellarAccount = account.networkType === 'stellar';
        const isStellarTokenActionsDisplayed = isStellarAccount && !isPortfolioTrackerDevice;

        return (
            <>
                <VStack spacing="sp24">
                    <AccountDiscoveryFailedBanner accountKey={accountKey} />

                    <YourPositionCard account={account} token={token} />

                    <TransactionListHeaderContent
                        accountKey={accountKey}
                        tokenContract={tokenContract}
                    />

                    {hasSelectedAssetTransactions && (
                        <Box paddingTop="sp8" paddingHorizontal="sp16">
                            <AccountDetailActionButtons
                                accountKey={accountKey}
                                tokenContract={tokenContract}
                            />
                        </Box>
                    )}
                    {isPriceCardDisplayed && (
                        <AssetPriceCard accountKey={accountKey} tokenContract={tokenContract} />
                    )}
                    {tokenContract && (
                        <YieldVaultBanner accountKey={accountKey} tokenContract={tokenContract} />
                    )}
                    {isStellarTokenActionsDisplayed && (
                        <StellarTokenActions
                            accountKey={accountKey}
                            tokenContract={tokenContract}
                        />
                    )}
                    {isStellarAccount && <StellarLimitedHistoryBanner />}
                    {account.networkType === 'solana' && <SolanaLimitedHistoryBanner />}
                    {account.networkType === 'tron' &&
                        !tokenContract &&
                        hasSelectedAssetTransactions && <TronResources accountKey={accountKey} />}
                </VStack>

                {hasSelectedAssetTransactions && (
                    <Box marginTop="sp52" marginHorizontal="sp16">
                        <Text variant="headline-sm">
                            <Translation id="transactions.title" />
                        </Text>
                    </Box>
                )}
            </>
        );
    },
);
