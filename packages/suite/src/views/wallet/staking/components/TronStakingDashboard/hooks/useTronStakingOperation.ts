import { useStakingAccess } from '@suite-common/earn-staking';
import { type StakingOperation, type StakingProductId } from '@suite-common/earn-staking-common';

import { useStakingOperationSwitch } from '#src/hooks/earn/useStakingOperationSwitch';

export type TronStakingOperation = {
    /** Withheld by the message system: the control is disabled and shows the message. */
    isDisabled: boolean;
    message: string | null;
    /** Withheld below the minimum firmware: the control stays enabled and opens the firmware modal. */
    isFirmwareOutdated: boolean;
};

export const useTronStakingOperation = (
    productId: StakingProductId | null,
    operation: StakingOperation,
): TronStakingOperation => {
    const { disabled } = useStakingAccess(productId);
    const { message } = useStakingOperationSwitch(productId, operation);

    const reason = disabled[operation];

    return {
        isDisabled: reason?.kind === 'message-system',
        message,
        isFirmwareOutdated: reason?.kind === 'firmware',
    };
};
