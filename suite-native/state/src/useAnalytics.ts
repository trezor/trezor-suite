import { useNativeServices } from './NativeServicesProvider';

export const useAnalytics = () => {
    const suiteServices = useNativeServices();

    return suiteServices.analytics;
};

/** @deprecated use `useAnalytics` instead */
export const useLegacyAnalytics = () => {
    const suiteServices = useNativeServices();

    return suiteServices.legacyAnalytics;
};
