import { selectLanguage } from '@suite/settings';
import {
    Feature,
    selectIsYieldFeatureDisabled,
    selectYieldFeatureMessage,
    selectYieldFeatureMessageContent,
} from '@suite-common/message-system';
import type { YieldFlowType } from '@suite-common/wallet-core';

import { useSelector } from './useSelector';

type UseMessageSystemYieldOptions = {
    vaultContractAddress?: string | null;
};

export const useMessageSystemYield = (
    type: YieldFlowType,
    options: UseMessageSystemYieldOptions = {},
) => {
    const language = useSelector(selectLanguage);
    const { vaultContractAddress } = options;

    const isDisabled = useSelector(state =>
        selectIsYieldFeatureDisabled(state, Feature.earn.yield[type], vaultContractAddress),
    );

    const content = useSelector(state =>
        selectYieldFeatureMessageContent(
            state,
            Feature.earn.yield[type],
            vaultContractAddress,
            language,
        ),
    );

    const variant = useSelector(
        state =>
            selectYieldFeatureMessage(state, Feature.earn.yield[type], vaultContractAddress)
                ?.variant,
    );

    return {
        isDisabled,
        content,
        variant,
    };
};
