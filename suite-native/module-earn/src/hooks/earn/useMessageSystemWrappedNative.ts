import { useSelector } from 'react-redux';

import { useMessageSystemWrappedNative as useMessageSystemWrappedNativeCore } from '@suite-common/message-system';
import { type WrappedNativeFlowType } from '@suite-common/wallet-core';
import { selectLocale } from '@suite-native/intl';

export const useMessageSystemWrappedNative = (type: WrappedNativeFlowType) => {
    const locale = useSelector(selectLocale);

    return useMessageSystemWrappedNativeCore({ type, locale });
};
