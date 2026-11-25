import { ASSET_TABLE_BALANCE_MAX_WIDTH, ASSET_TABLE_LINE_GAP } from '@suite/assets';
import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Column, Text } from '@trezor/components';

import { TruncatedAmount } from '#src/components/earn/yield/common/TruncatedAmount';
import { BaseCurrencyValue } from '#src/components/suite/BaseCurrencyValue';
import { FormattedCryptoAmount } from '#src/components/suite/FormattedCryptoAmount';

type AssetTableAmountProps = {
    symbol: NetworkSymbol;
    contractAddress: TokenAddress | undefined;
    amount: string;
};

/** An amount as an asset table's balance column shows it: in fiat, and below it in the asset. */
export const AssetTableAmount = ({ symbol, contractAddress, amount }: AssetTableAmountProps) => (
    <Column alignItems="flex-end" gap={ASSET_TABLE_LINE_GAP}>
        <BaseCurrencyValue
            data-testid="@asset-table/fiat-balance"
            amount={amount}
            symbol={symbol}
            tokenAddress={contractAddress}
        />
        <Text
            intent="neutral"
            priority="secondary"
            typographyStyle="body-sm"
            ellipsisLineCount={1}
            maxWidth={ASSET_TABLE_BALANCE_MAX_WIDTH}
        >
            <TruncatedAmount>
                <FormattedCryptoAmount
                    data-testid="@asset-table/crypto-balance"
                    value={amount}
                    networkSymbol={symbol}
                    contractAddress={contractAddress}
                    isCompact
                />
            </TruncatedAmount>
        </Text>
    </Column>
);
