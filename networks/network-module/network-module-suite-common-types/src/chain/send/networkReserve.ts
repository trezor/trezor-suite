import { BigNumber } from '@trezor/utils';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

/** The reserve applies to the network's coin, and only when the user enabled it. */
export const isNetworkReserveApplicable = (
    contractAddress: string | null | undefined,
    isEnabled: boolean | undefined,
) => !((!!contractAddress && contractAddress !== ZERO_ADDRESS) || !isEnabled);

export type GetMaxAmountWithReserveParams = {
    /** The reserve in units, when it applies. */
    networkReserve: string | undefined;
    balance: string;
    amount: string;
    fee?: string;
};

/** The most that can be sent while keeping the reserve and the fee, all in units. */
export const getMaxAmountWithReserve = ({
    networkReserve,
    balance,
    amount,
    fee = '0',
}: GetMaxAmountWithReserveParams) => {
    if (!networkReserve) return amount;

    const accountBalance = new BigNumber(balance);
    const reservePlusFee = new BigNumber(networkReserve).plus(fee);

    if (new BigNumber(amount).plus(reservePlusFee).gt(accountBalance)) {
        const maxAmount = accountBalance.minus(reservePlusFee);

        return maxAmount.lt(0) ? '0' : maxAmount.toFixed();
    }

    return amount;
};
