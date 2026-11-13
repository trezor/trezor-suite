import type { StakingAmount } from '@suite-common/earn-staking-common';
import { getAccountDecimals } from '@suite-common/wallet-utils';
import type { NetworkSymbol } from '@trezor/network-module-types';
import { BigNumber } from '@trezor/utils';

export type FormatStakingAmountParams = {
    amount: StakingAmount;
    networkSymbol: NetworkSymbol;
};

export const formatStakingAmount = ({
    amount,
    networkSymbol,
}: FormatStakingAmountParams): string => {
    const decimals = getAccountDecimals(networkSymbol);

    if (decimals === undefined) {
        return amount;
    }

    return new BigNumber(amount).shiftedBy(-decimals).toFixed();
};
