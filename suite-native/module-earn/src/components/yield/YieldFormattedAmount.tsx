import { toTokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type TextProps } from '@suite-native/atoms';
import {
    CompactCryptoAmountFormatter,
    CompactTokenAmountFormatter,
    type DiscreetMode,
    asDecimalTokenAmount,
} from '@suite-native/formatters';

export type YieldFormattedAmountValue = {
    value: string;
    tokenContract?: string | null;
};

type YieldFormattedAmountProps = YieldFormattedAmountValue & {
    networkSymbol: NetworkSymbol;
    discreetMode?: DiscreetMode;
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
    // Keep transaction amounts and allowance limits readable during yield actions.
    discreetMode = 'disabled',
    ...textProps
}: YieldFormattedAmountProps) => {
    if (tokenContract) {
        return (
            <CompactTokenAmountFormatter
                networkSymbol={networkSymbol}
                contractAddress={toTokenAddress(tokenContract)}
                value={asDecimalTokenAmount(value)}
                discreetMode={discreetMode}
                {...textProps}
            />
        );
    }

    return (
        <CompactCryptoAmountFormatter
            value={value}
            symbol={networkSymbol}
            discreetMode={discreetMode}
            {...textProps}
        />
    );
};
