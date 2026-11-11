import { useFormatters } from '@suite-common/formatters';
import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { type AmountUnit } from '@suite-common/wallet-utils';
import { Text, type TextProps } from '@suite-native/atoms';
import { TokenSymbol } from '@suite-native/tokens';

type AssetValueProps = Omit<TextProps, 'children'> & {
    amount: AmountUnit;
    networkSymbol: NetworkSymbol;
    contractAddress?: TokenAddress;
};

/** An amount of a coin or a token; an unrecognized token's symbol has its URLs masked. */
export const AssetValue = ({
    amount,
    networkSymbol,
    contractAddress,
    ...textProps
}: AssetValueProps) => {
    const { CryptoAmountFormatter } = useFormatters();

    return (
        <Text {...textProps}>
            {/* The amount is already in main units, and the symbol is rendered as a component. */}
            <CryptoAmountFormatter
                value={amount.toFixed()}
                smallestUnitsOverride={false}
                withSymbol={false}
            />{' '}
            {contractAddress ? (
                <TokenSymbol
                    {...textProps}
                    networkSymbol={networkSymbol}
                    contractAddress={contractAddress}
                />
            ) : (
                getNetworkDisplaySymbol(networkSymbol)
            )}
        </Text>
    );
};
