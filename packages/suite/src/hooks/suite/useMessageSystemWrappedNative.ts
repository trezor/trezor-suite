import { selectLanguage } from '@suite/settings';
import { useMessageSystemWrappedNative as useMessageSystemWrappedNativeCore } from '@suite-common/message-system';

import { useSelector } from './useSelector';

export const useMessageSystemWrappedNative = () => {
    const locale = useSelector(selectLanguage);

    return useMessageSystemWrappedNativeCore({ locale });
};
