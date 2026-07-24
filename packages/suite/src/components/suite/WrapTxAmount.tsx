import { useMemo } from 'react';

import { getWrappedNativeSymbol } from '@suite-common/wallet-config';
import { type WalletAccountTransaction } from '@suite-common/wallet-types';
import {
    asAmountSubunit,
    getNativeWrapTxKind,
    getUnwrapAmountByEthereumDataHex,
    subunitsToUnits,
} from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { FormattedCryptoAmount } from './FormattedCryptoAmount';

interface WrapTxAmountProps {
    transaction: WalletAccountTransaction;
    /** Render the wrapped-token symbol (e.g. WETH) instead of the native one (e.g. ETH). */
    wrapped?: boolean;
}

export const WrapTxAmount = ({ transaction, wrapped }: WrapTxAmountProps) => {
    const { symbol } = transaction;

    const amount = useMemo(() => {
        const kind = getNativeWrapTxKind(transaction);

        if (!kind) return undefined;

        // Wrapping is 1:1, so both legs show the same amount and only differ in symbol. The amount
        // is the transaction value for a wrap and the withdraw(uint256) calldata for an unwrap.
        const subunits =
            kind === 'wrap'
                ? transaction.amount
                : getUnwrapAmountByEthereumDataHex(transaction.ethereumSpecific?.data);

        return subunits
            ? subunitsToUnits({ value: asAmountSubunit(new BigNumber(subunits)), symbol })
            : undefined;
    }, [transaction, symbol]);

    if (!amount) return null;

    return (
        <FormattedCryptoAmount
            value={amount}
            symbol={wrapped ? (getWrappedNativeSymbol(symbol) ?? symbol) : symbol}
        />
    );
};
