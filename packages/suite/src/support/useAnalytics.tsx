import { useSuiteServices } from './SuiteServicesProvider';

export const useAnalytics = () => {
    const suiteServices = useSuiteServices();

    return suiteServices['analytics'];
};

/** @deprecated use `useAnalytics` instead */
export const useLegacyAnalytics = () => {
    const suiteServices = useSuiteServices();

    return suiteServices['legacyAnalytics'];
};
