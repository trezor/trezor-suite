import { selectLanguage } from '@suite/settings';
import {
    selectIsStakingOperationDisabled,
    selectStakingOperationMessageContent,
} from '@suite-common/earn-staking';
import { type StakingOperation, type StakingProductId } from '@suite-common/earn-staking-common';

import { useSelector } from '#src/hooks/suite/useSelector';

export type StakingOperationSwitch = {
    isDisabled: boolean;
    message: string | null;
};

// The message-system switch of one operation, as the dashboards show it: a disabled button with
// the message in its tooltip.
export const useStakingOperationSwitch = (
    productId: StakingProductId | null,
    operation: StakingOperation,
): StakingOperationSwitch => {
    const locale = useSelector(selectLanguage);

    const isDisabled = useSelector(
        state =>
            productId !== null && selectIsStakingOperationDisabled(state, productId, operation),
    );

    const message = useSelector(state =>
        productId === null
            ? null
            : selectStakingOperationMessageContent(state, productId, operation, locale),
    );

    return { isDisabled, message };
};
