import { useFormatters } from '@suite-common/formatters';
import { useTokenMetadata } from '@suite-common/token';
import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AmountUnit } from '@suite-common/wallet-utils';
import { Text, type TextProps } from '@suite-native/atoms';

import { AssetSymbol } from './AssetSymbol';

type AssetValueProps = Omit<TextProps, 'children'> & {
    amount: AmountUnit;
    networkSymbol: NetworkSymbol;
    contractAddress?: TokenAddress;
    isCompact?: boolean;
};

/** An amount of a native token or a token; an unrecognized token's symbol has its URLs masked. */
export const AssetValue = ({
    amount,
    networkSymbol,
    contractAddress,
    isCompact = false,
    ...textProps
}: AssetValueProps) => {
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
            <AssetSymbol
                {...textProps}
                networkSymbol={networkSymbol}
                contractAddress={contractAddress}
            />
        </Text>
    );
};
