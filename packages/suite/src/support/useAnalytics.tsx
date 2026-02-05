import { useSuiteServices } from './SuiteServicesProvider';

export const useAnalytics = () => {
    const suiteServices = useSuiteServices();

    return suiteServices['analytics'];
};
