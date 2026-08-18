import { asAmountSubunit, subunitsToUnits } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

// EVM reports both as decimal strings, Solana as numbers.
type AssetDiffTransfer = {
    raw_value: string | number;
    value?: string | number | null;
};

/**
 * Amount of a single asset-diff transfer in main units.
 */
export const getAssetDiffTransferAmount = (
    transfer: AssetDiffTransfer,
    decimals: number | undefined,
): BigNumber | null => {
    if (decimals !== undefined) {
        const rawValue = new BigNumber(transfer.raw_value);

        if (!rawValue.isNaN()) {
            return subunitsToUnits({ value: asAmountSubunit(rawValue), decimals });
        }
    }

    return transfer.value === undefined || transfer.value === null
        ? null
        : new BigNumber(transfer.value);
};
