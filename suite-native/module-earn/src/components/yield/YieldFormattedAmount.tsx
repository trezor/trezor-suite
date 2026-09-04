import { type NetworkSymbol } from '@suite-common/wallet-config';
import { toTokenSymbol } from '@suite-common/wallet-types';
import { type TextProps } from '@suite-native/atoms';
import {
    CompactCryptoAmountFormatter,
    CompactTokenAmountFormatter,
    asDecimalTokenAmount,
} from '@suite-native/formatters';

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
            <CompactTokenAmountFormatter
                value={asDecimalTokenAmount(value)}
                tokenDecimals={tokenDecimals}
                tokenSymbol={tokenSymbol ? toTokenSymbol(tokenSymbol) : null}
                isDiscreetText={false}
                {...textProps}
            />
        );
    }

    return (
        <CompactCryptoAmountFormatter
            value={value}
            symbol={networkSymbol}
            isDiscreetText={false}
            {...textProps}
        />
    );
};
