import { redactNumericalSubstring, useDiscreetMode } from '@suite-common/discreet-mode';
import { useFormatters } from '@suite-common/formatters';
import { type WalletAccountTransaction } from '@suite-common/wallet-types';
import { Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { type NativeTypographyStyle } from '@trezor/theme';

type UnstakeTransactionDetailTitleProps = {
    unstakeAmount: string;
    symbol: WalletAccountTransaction['symbol'];
    variant?: NativeTypographyStyle;
};

export const UnstakeTransactionDetailTitle = ({
    unstakeAmount,
    symbol,
    variant,
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
        <Text variant={variant}>
            <Translation
                id="transactions.detail.unstakeHeader"
                values={{ amount: displayedUnstakeAmount }}
            />
        </Text>
    );
};
