import { toTokenSymbol } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { toTokenAddress } from '@suite-common/wallet-types';
import { type TextProps } from '@suite-native/atoms';
import {
    CompactCryptoAmountFormatter,
    CompactTokenAmountFormatter,
    asDecimalTokenAmount,
} from '@suite-native/formatters';
import { TokenMetadataProvider } from '@suite-native/tokens';

export type YieldFormattedAmountValue = {
    value: string;
    tokenContract?: string | null;
    tokenDecimals?: number;
    tokenSymbol?: string | null;
};

type YieldFormattedAmountProps = YieldFormattedAmountValue & {
    networkSymbol: NetworkSymbol;
} & Pick<
        TextProps,
        | 'adjustsFontSizeToFit'
        | 'color'
        | 'ellipsizeMode'
        | 'numberOfLines'
        | 'style'
        | 'textAlign'
        | 'variant'
    >;

export const YieldFormattedAmount = ({
    networkSymbol,
    tokenContract,
    tokenDecimals,
    tokenSymbol,
    value,
    ...textProps
}: YieldFormattedAmountProps) => {
    if (tokenContract) {
        return (
            <TokenMetadataProvider
                networkSymbol={networkSymbol}
                tokens={[
                    {
                        contract: tokenContract,
                        symbol: tokenSymbol ?? undefined,
                        decimals: tokenDecimals,
                    },
                ]}
            >
                <CompactTokenAmountFormatter
                    networkSymbol={networkSymbol}
                    contractAddress={toTokenAddress(tokenContract)}
                    value={asDecimalTokenAmount(value)}
                    // Keep transaction amounts and allowance limits readable during yield actions.
                    discreetMode="disabled"
                    {...textProps}
                />
            </TokenMetadataProvider>
        );
    }

    return (
        <CompactCryptoAmountFormatter
            value={value}
            symbol={networkSymbol}
            // Keep transaction amounts and allowance limits readable during yield actions.
            discreetMode="disabled"
            {...textProps}
        />
    );
};
