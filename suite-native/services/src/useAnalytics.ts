import { useNativeServices } from './NativeServicesProvider';

/** @deprecated use `useAnalytics` instead */
export const useLegacyAnalytics = () => {
    const suiteServices = useNativeServices();

    return suiteServices.legacyAnalytics;
};
