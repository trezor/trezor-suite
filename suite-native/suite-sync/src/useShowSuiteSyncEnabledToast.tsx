import { Translation } from '@suite-native/intl';
import { useToast } from '@suite-native/toasts';

export const useShowSuiteSyncEnabledToast = () => {
    const { showToast } = useToast();

    const showSuiteSyncEnabledToast = () => {
        showToast({
            intent: 'neutral',
            icon: 'check',
            message: <Translation id="suiteSync.enabledToast" />,
        });
    };

    return { showSuiteSyncEnabledToast };
};
