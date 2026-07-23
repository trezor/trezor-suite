import { useSelector } from 'react-redux';

import { type YieldFlowType } from '@suite-common/suite-types';

import {
    selectIsYieldFeatureDisabled,
    selectYieldFeatureMessage,
    selectYieldFeatureMessageContent,
} from './messageSystemSelectors';
import { Feature, type MessageSystemRootState } from './messageSystemTypes';

interface UseMessageSystemYieldProps {
    type: YieldFlowType;
    vaultContractAddress?: string | null;
    locale: string;
}

export const useMessageSystemYield = ({
    type,
    vaultContractAddress,
    locale,
}: UseMessageSystemYieldProps) => {
    const isDisabled = useSelector((state: MessageSystemRootState) =>
        selectIsYieldFeatureDisabled(state, Feature.earn.yield[type], vaultContractAddress),
    );

    const content = useSelector((state: MessageSystemRootState) =>
        selectYieldFeatureMessageContent(
            state,
            Feature.earn.yield[type],
            vaultContractAddress,
            locale,
        ),
    );

    const variant = useSelector(
        (state: MessageSystemRootState) =>
            selectYieldFeatureMessage(state, Feature.earn.yield[type], vaultContractAddress)
                ?.variant,
    );

    return {
        isDisabled,
        content,
        variant,
    };
};
