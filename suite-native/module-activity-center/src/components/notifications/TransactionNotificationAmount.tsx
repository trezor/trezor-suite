import { type NetworkSymbol } from '@suite-common/wallet-config';
import { toTokenSymbol } from '@suite-common/wallet-types';
import { type TextProps } from '@suite-native/atoms';
import {
    CompactCryptoAmountFormatter,
    CompactTokenAmountFormatter,
    NftTokenIdFormatter,
    asDecimalTokenAmount,
} from '@suite-native/formatters';

type TransactionNotificationAmountProps = {
    amount: string;
    symbol: NetworkSymbol;
    tokenSymbol?: string;
    tokenDecimals?: number;
    isNftTransfer: boolean;
    color: TextProps['color'];
};

export const TransactionNotificationAmount = ({
    amount,
    symbol,
    tokenSymbol,
    tokenDecimals,
    isNftTransfer,
    color,
}: TransactionNotificationAmountProps) => {
    // The amount of an NFT notification is its token ID.
    if (isNftTransfer) {
        return (
            <NftTokenIdFormatter
                value={amount}
                tokenSymbol={tokenSymbol ? toTokenSymbol(tokenSymbol) : null}
                variant="body-xs"
                color={color}
            />
        );
    }

    if (tokenSymbol === undefined) {
        return (
            <CompactCryptoAmountFormatter
                value={amount}
                symbol={symbol}
                variant="body-xs"
                color={color}
            />
        );
    }

    return (
        <CompactTokenAmountFormatter
            value={asDecimalTokenAmount(amount)}
            tokenSymbol={toTokenSymbol(tokenSymbol)}
            tokenDecimals={tokenDecimals}
            variant="body-xs"
            color={color}
        />
    );
};
