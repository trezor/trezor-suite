import { type AssetId, parseAssetId } from '@suite-common/assets';
import { useFormatters } from '@suite-common/formatters';
import { useTokenMetadata } from '@suite-common/token';
import { type AmountUnit } from '@suite-common/wallet-utils';
import { Text, type TextProps } from '@suite-native/atoms';

import { AssetSymbol } from './AssetSymbol';

type AssetValueProps = Omit<TextProps, 'children'> & {
    assetId: AssetId;
    amount: AmountUnit;
    isCompact?: boolean;
};

/** An amount of a native token or a token; an unrecognized token's symbol has its URLs masked. */
export const AssetValue = ({
    amount,
    assetId,
    isCompact = false,
    ...textProps
}: AssetValueProps) => {
    const { networkSymbol, contractAddress } = parseAssetId(assetId);
    const { CryptoAmountFormatter } = useFormatters();
    const token = useTokenMetadata(networkSymbol, contractAddress);
    const formatStyle = isCompact ? 'compact-balance' : 'exact';

    if (!contractAddress) {
        // `isBalance` shows the amount in the unit chosen in the settings, e.g. sats.
        return (
            <Text {...textProps}>
                <CryptoAmountFormatter
                    value={amount.toFixed()}
                    symbol={networkSymbol}
                    isBalance
                    formatStyle={formatStyle}
                />
            </Text>
        );
    }

    return (
        <Text {...textProps}>
            {/* The amount is already in main units, and the symbol is rendered as a component. */}
            <CryptoAmountFormatter
                value={amount.toFixed()}
                smallestUnitsOverride={false}
                withSymbol={false}
                formatStyle={formatStyle}
                tokenDecimals={token?.decimals}
            />{' '}
            <AssetSymbol {...textProps} assetId={assetId} />
        </Text>
    );
};
