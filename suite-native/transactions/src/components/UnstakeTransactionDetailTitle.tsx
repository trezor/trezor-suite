import { redactNumericalSubstring, useDiscreetMode } from '@suite-common/discreet-mode';
import { useFormatters } from '@suite-common/formatters';
import { type WalletAccountTransaction } from '@suite-common/wallet-types';
import { Text, type TextProps } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

type UnstakeTransactionDetailTitleProps = TextProps & {
    unstakeAmount: string;
    symbol: WalletAccountTransaction['symbol'];
};

export const UnstakeTransactionDetailTitle = ({
    unstakeAmount,
    symbol,
    ...textProps
}: UnstakeTransactionDetailTitleProps) => {
    const { CryptoAmountFormatter: cryptoAmountFormatter } = useFormatters();
    const { isDiscreetMode } = useDiscreetMode();

    const formattedUnstakeAmount = cryptoAmountFormatter.format(unstakeAmount, {
        symbol,
        isBalance: false,
        isEllipsisAppended: false,
    });
    const displayedUnstakeAmount = isDiscreetMode
        ? redactNumericalSubstring(formattedUnstakeAmount)
        : formattedUnstakeAmount;

    return (
        <Text {...textProps}>
            <Translation
                id="transactions.detail.unstakeHeader"
                values={{ amount: displayedUnstakeAmount }}
            />
        </Text>
    );
};
