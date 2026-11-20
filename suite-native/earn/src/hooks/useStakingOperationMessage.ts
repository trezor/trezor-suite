import { useSelector } from 'react-redux';

import {
    type StakingRootState,
    selectStakingOperationMessageContent,
} from '@suite-common/earn-staking';
import { type StakingOperation, type StakingProductId } from '@suite-common/earn-staking-common';
import { type MessageSystemRootState } from '@suite-common/message-system';
import { selectLocale } from '@suite-native/intl';

export const useStakingOperationMessage = (
    productId: StakingProductId | null,
    operation: StakingOperation,
): string | null => {
    const locale = useSelector(selectLocale);

    return useSelector((state: StakingRootState & MessageSystemRootState) =>
        productId === null
            ? null
            : selectStakingOperationMessageContent(state, productId, operation, locale),
    );
};
