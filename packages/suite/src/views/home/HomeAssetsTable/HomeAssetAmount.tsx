import { type TokenAddress, type TokenSymbol } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Column, Text } from '@trezor/components';

import { TruncatedAmount } from 'src/components/earn/yield/common/TruncatedAmount';
import { BaseCurrencyValue, FormattedCryptoAmount } from 'src/components/suite';

import { HOME_ASSET_BALANCE_MAX_WIDTH, HOME_ASSET_LINE_GAP } from './homeAssetTableLayout';

type HomeAssetAmountProps = {
    symbol: NetworkSymbol;
    contractAddress: TokenAddress | undefined;
    tokenSymbol: TokenSymbol | null | undefined;
    tokenDecimals: number | undefined;
    amount: string;
};

/** An amount as an asset table's balance column shows it: in fiat, and below it in the asset. */
export const HomeAssetAmount = ({
    symbol,
    contractAddress,
    tokenSymbol,
    tokenDecimals,
    amount,
}: HomeAssetAmountProps) => (
    <Column alignItems="flex-end" gap={HOME_ASSET_LINE_GAP}>
        <BaseCurrencyValue amount={amount} symbol={symbol} tokenAddress={contractAddress} />
        <Text
            intent="neutral"
            priority="secondary"
            typographyStyle="body-sm"
            ellipsisLineCount={1}
            maxWidth={HOME_ASSET_BALANCE_MAX_WIDTH}
        >
            <TruncatedAmount>
                <FormattedCryptoAmount
                    value={amount}
                    symbol={tokenSymbol ?? symbol}
                    contractAddress={contractAddress}
                    tokenDecimals={tokenDecimals}
                    isCompact
                />
            </TruncatedAmount>
        </Text>
    </Column>
);
