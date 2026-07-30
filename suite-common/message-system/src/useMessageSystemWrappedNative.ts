import { useSelector } from 'react-redux';

import {
    selectFeatureMessage,
    selectFeatureMessageContent,
    selectIsFeatureDisabled,
} from './messageSystemSelectors';
import { Feature, type MessageSystemRootState } from './messageSystemTypes';

interface UseMessageSystemWrappedNativeProps {
    locale: string;
}

/**
 * Reads the remote message-system gate for the native-token wrap/unwrap feature (e.g. ETH ↔ WETH).
 *
 * These are global flags evaluated with the plain (non-vault-scoped) selectors, so wrap/unwrap
 * gating stays independent of the `earn.yield.*` vault flags.
 */
export const useMessageSystemWrappedNative = ({ locale }: UseMessageSystemWrappedNativeProps) => {
    const isWrapDisabled = useSelector((state: MessageSystemRootState) =>
        selectIsFeatureDisabled(state, Feature.earn.wrap),
    );
    const isUnwrapDisabled = useSelector((state: MessageSystemRootState) =>
        selectIsFeatureDisabled(state, Feature.earn.unwrap),
    );

    const wrapMessageContent = useSelector((state: MessageSystemRootState) =>
        selectFeatureMessageContent(state, Feature.earn.wrap, locale),
    );
    const unwrapMessageContent = useSelector((state: MessageSystemRootState) =>
        selectFeatureMessageContent(state, Feature.earn.unwrap, locale),
    );

    const wrapVariant = useSelector(
        (state: MessageSystemRootState) => selectFeatureMessage(state, Feature.earn.wrap)?.variant,
    );
    const unwrapVariant = useSelector(
        (state: MessageSystemRootState) =>
            selectFeatureMessage(state, Feature.earn.unwrap)?.variant,
    );

    return {
        isWrapDisabled,
        isUnwrapDisabled,
        wrapMessageContent,
        unwrapMessageContent,
        wrapVariant,
        unwrapVariant,
    };
};
