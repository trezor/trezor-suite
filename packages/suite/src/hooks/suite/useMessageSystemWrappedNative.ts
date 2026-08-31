import { selectLanguage } from '@suite/settings';
import { useMessageSystemWrappedNative as useMessageSystemWrappedNativeCore } from '@suite-common/message-system';
import { useSelector } from '@suite-common/redux-utils';
import type { WrappedNativeFlowType } from '@suite-common/wallet-core';

export const useMessageSystemWrappedNative = (type: WrappedNativeFlowType) => {
    const locale = useSelector(selectLanguage);

    return useMessageSystemWrappedNativeCore({ type, locale });
};
