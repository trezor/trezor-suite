import { selectLanguage } from '@suite/settings';
import { useMessageSystemWrappedNative as useMessageSystemWrappedNativeCore } from '@suite-common/message-system';
import type { WrappedNativeFlowType } from '@suite-common/wallet-core';

import { useSelector } from './useSelector';

export const useMessageSystemWrappedNative = (type: WrappedNativeFlowType) => {
    const locale = useSelector(selectLanguage);

    return useMessageSystemWrappedNativeCore({ type, locale });
};
