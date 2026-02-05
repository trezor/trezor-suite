import { useNativeServices } from './NativeServicesProvider';

export const useAnalytics = () => {
    const suiteServices = useNativeServices();

    return suiteServices.analytics;
};
