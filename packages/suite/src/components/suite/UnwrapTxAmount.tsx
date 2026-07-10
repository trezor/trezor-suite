import { type WalletAccountTransaction } from '@suite-common/wallet-types';
import {
    asAmountSubunit,
    getUnwrapAmountByEthereumDataHex,
    subunitsToUnits,
} from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { FormattedCryptoAmount } from './FormattedCryptoAmount';

interface UnwrapTxAmountProps {
    transaction: WalletAccountTransaction;
}

export const UnwrapTxAmount = ({ transaction }: UnwrapTxAmountProps) => {
    const unwrapAmount = getUnwrapAmountByEthereumDataHex(transaction.ethereumSpecific?.data);

    if (!unwrapAmount) return null;

    return (
        <>
            {' '}
            <FormattedCryptoAmount
                value={subunitsToUnits({
                    value: asAmountSubunit(new BigNumber(unwrapAmount)),
                    symbol: transaction.symbol,
                })}
                symbol={transaction.symbol}
            />
        </>
    );
};
