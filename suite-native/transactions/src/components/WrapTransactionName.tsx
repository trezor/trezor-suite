import { redactNumericalSubstring, useDiscreetMode } from '@suite-common/discreet-mode';
import { useFormatters } from '@suite-common/formatters';
import { getNetworkDisplaySymbol, getWrappedNativeSymbol } from '@suite-common/wallet-config';
import { type WalletAccountTransaction } from '@suite-common/wallet-types';
import { getUnwrapAmountByEthereumDataHex } from '@suite-common/wallet-utils';
import { Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { type NativeTypographyStyle } from '@trezor/theme';

type WrapTransactionNameProps = {
    transaction: WalletAccountTransaction;
    kind: 'wrap' | 'unwrap';
    variant?: NativeTypographyStyle;
};

// Mirrors desktop's `WrapTxAmount` (packages/suite/src/components/suite/WrapTxAmount.tsx): wrapping is
// 1:1, so both legs share the same amount and differ only in symbol. The amount is the transaction
// value for a wrap and the withdraw(uint256) calldata for an unwrap, and the label always shows it in
// the wrapped-native token (e.g. WETH).
export const WrapTransactionName = ({ transaction, kind, variant }: WrapTransactionNameProps) => {
    const { CryptoAmountFormatter: cryptoAmountFormatter } = useFormatters();
    const { isDiscreetMode } = useDiscreetMode();

    const { symbol } = transaction;

    const subunits =
        kind === 'wrap'
            ? transaction.amount
            : getUnwrapAmountByEthereumDataHex(transaction.ethereumSpecific?.data);

    const wrappedSymbol = getWrappedNativeSymbol(symbol) ?? getNetworkDisplaySymbol(symbol);

    // The formatter's `symbol` drives both the subunit→unit conversion and the appended ticker, and
    // the wrapped symbol (WETH) is not a NetworkSymbol. So convert using the native symbol's decimals
    // (WETH shares them) with `withSymbol: false`, then append the wrapped ticker ourselves.
    const formattedAmount = subunits
        ? cryptoAmountFormatter.format(subunits, {
              symbol,
              isBalance: false,
              withSymbol: false,
              isEllipsisAppended: false,
          })
        : undefined;

    const wrappedAmountText = formattedAmount ? `${formattedAmount} ${wrappedSymbol}` : '';
    const wrappedAmount = isDiscreetMode
        ? redactNumericalSubstring(wrappedAmountText)
        : wrappedAmountText;

    return (
        <Text variant={variant}>
            <Translation
                id={kind === 'wrap' ? 'transactions.name.wrap' : 'transactions.name.unwrap'}
                values={{ nativeSymbol: getNetworkDisplaySymbol(symbol), wrappedAmount }}
            />
        </Text>
    );
};
