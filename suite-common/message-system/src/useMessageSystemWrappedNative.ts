import { useSelector } from 'react-redux';

import { type WrappedNativeFlowType } from '@suite-common/suite-types';

import {
    selectFeatureMessage,
    selectFeatureMessageContent,
    selectIsFeatureDisabled,
} from './messageSystemSelectors';
import { Feature, type MessageSystemRootState } from './messageSystemTypes';

interface UseMessageSystemWrappedNativeProps {
    type: WrappedNativeFlowType;
    locale: string;
}

export const useMessageSystemWrappedNative = ({
    type,
    locale,
}: UseMessageSystemWrappedNativeProps) => {
    const domain = Feature.earn.wrappedNative[type];

    const isDisabled = useSelector((state: MessageSystemRootState) =>
        selectIsFeatureDisabled(state, domain),
    );

    const content = useSelector((state: MessageSystemRootState) =>
        selectFeatureMessageContent(state, domain, locale),
    );

    const variant = useSelector(
        (state: MessageSystemRootState) => selectFeatureMessage(state, domain)?.variant,
    );

    return {
        isDisabled,
        content,
        variant,
    };
};
