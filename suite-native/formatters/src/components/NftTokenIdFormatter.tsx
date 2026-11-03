import { type TokenSymbol } from '@suite-common/wallet-types';
import { type TextProps } from '@suite-native/atoms';

import { type FormatterProps } from '../types';
import { FormattedCryptoAmountText } from './FormattedCryptoAmountText';

export type NftTokenIdFormatterProps = FormatterProps<string> & {
    tokenSymbol: TokenSymbol | null;
    isPhishingTransaction?: boolean;
} & TextProps;

// An NFT transfer carries a token ID rather than an amount, so it must never be divided by the
// token's decimals or converted to fiat.
export const NftTokenIdFormatter = ({
    value,
    tokenSymbol,
    isPhishingTransaction = false,
    ...rest
}: NftTokenIdFormatterProps) => {
    const tokenId = `#${value}`;

    return (
        <FormattedCryptoAmountText
            formattedValue={tokenSymbol ? `${tokenSymbol} ${tokenId}` : tokenId}
            isForcedDiscreetMode={isPhishingTransaction}
            {...rest}
        />
    );
};
