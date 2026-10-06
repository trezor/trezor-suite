import { isDecimalsValid } from '@suite-common/wallet-utils';
import { type TxKeyPath } from '@suite-native/intl';
import { BigNumber } from '@trezor/utils';

import { EARN_MODULE_PREFIX } from '../../constants';

export const getYieldWithdrawFormDraftKey = (flowKey: string) =>
    `${EARN_MODULE_PREFIX}/yield-withdraw/${flowKey}`;

export const getYieldWithdrawAmountValidationError = ({
    amount,
    decimals,
}: {
    amount: string;
    decimals?: number;
}): TxKeyPath | null => {
    if (!amount || decimals === undefined) {
        return null;
    }

    if (new BigNumber(amount).isZero()) {
        return 'earn.yieldWithdrawFlowScreen.validation.amountIsZero';
    }

    if (!isDecimalsValid(amount, decimals)) {
        return 'earn.yieldWithdrawFlowScreen.validation.tooManyDecimals';
    }

    return null;
};
