import { toTokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type TextProps } from '@suite-native/atoms';
import {
    CompactCryptoAmountFormatter,
    CompactTokenAmountFormatter,
    asDecimalTokenAmount,
} from '@suite-native/formatters';

export type YieldFormattedAmountValue = {
    value: string;
    tokenContract?: string | null;
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
    value,
    ...textProps
}: YieldFormattedAmountProps) => {
    if (tokenContract) {
        return (
            <CompactTokenAmountFormatter
                networkSymbol={networkSymbol}
                contractAddress={toTokenAddress(tokenContract)}
                value={asDecimalTokenAmount(value)}
                // Keep transaction amounts and allowance limits readable during yield actions.
                discreetMode="disabled"
                {...textProps}
            />
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
