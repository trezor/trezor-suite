import { useSelector } from 'react-redux';

import { isSendingEvmNativeToken } from '@suite-common/trading';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type Account, type TokenAddress, type TokenSymbol } from '@suite-common/wallet-types';
import { DiscreetTextTrigger, HStack, Text } from '@suite-native/atoms';
import {
    CompactCryptoAmountFormatter,
    CompactTokenAmountFormatter,
    asDecimalTokenAmount,
} from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';
import { type TokensRootState, selectAccountTokenBalance } from '@suite-native/tokens';
import { type TradeableAsset } from '@suite-native/trading-types';

export type TradeableAssetAccountBalanceProps = {
    account?: Account;
    asset?: TradeableAsset;
    testID?: string;
};

type TokenBalanceProps = {
    accountKey: Account['key'];
    tokenAddress: TokenAddress;
    tokenDecimals?: number;
    symbol: string;
    testID?: string;
};

type AssetBalanceProps = {
    account: Account;
    asset: TradeableAsset;
    testID?: string;
};

const TokenBalance = ({
    accountKey,
    tokenAddress,
    tokenDecimals,
    symbol,
    testID,
}: TokenBalanceProps) => {
    const balance = useSelector(
        (state: TokensRootState) =>
            selectAccountTokenBalance(state, accountKey, tokenAddress) ?? '0',
    );

    return (
        <CompactTokenAmountFormatter
            value={asDecimalTokenAmount(balance)}
            tokenSymbol={symbol as TokenSymbol}
            tokenDecimals={tokenDecimals}
            testID={testID}
        />
    );
};

const AssetBalance = ({ account, asset, testID }: AssetBalanceProps) => {
    const { cryptoId, symbol } = asset;
    const { key: accountKey, formattedBalance } = account;

    const tokenAddress = isSendingEvmNativeToken(cryptoId) ? undefined : asset.contractAddress;

    return (
        <DiscreetTextTrigger>
            {tokenAddress ? (
                <TokenBalance
                    symbol={symbol}
                    accountKey={accountKey}
                    tokenAddress={tokenAddress}
                    tokenDecimals={asset.decimals}
                    testID={testID}
                />
            ) : (
                <CompactCryptoAmountFormatter
                    value={formattedBalance}
                    symbol={symbol as NetworkSymbol}
                    testID={testID}
                />
            )}
        </DiscreetTextTrigger>
    );
};

export const TradeableAssetAccountBalance = ({
    account,
    asset,
    testID,
}: TradeableAssetAccountBalanceProps) => {
    if (!asset) {
        return null;
    }

    const balanceTestID = testID ? `${testID}/value` : undefined;
    const noBalanceTestID = testID ? `${testID}/no-value` : undefined;

    return (
        <HStack testID={testID}>
            <Text variant="body-sm" color="contentSecondary">
                <Translation id="moduleTrading.tradingScreen.balance" />
            </Text>
            {account ? (
                <AssetBalance account={account} asset={asset} testID={balanceTestID} />
            ) : (
                <Text variant="body-sm" color="contentSecondary" testID={noBalanceTestID}>
                    - {asset.symbol}
                </Text>
            )}
        </HStack>
    );
};
