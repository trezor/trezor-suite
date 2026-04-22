import { type ReactNode } from 'react';

const analyticsMock = {
    report: () => {},
    isEnabled: () => true,
    disable: () => {},
    enable: () => {},
    setUrl: () => {},
    setLoggerEnabled: () => {},
    init: () => {},
};

const servicesMock = {
    analytics: analyticsMock,
};

export const NativeServicesProvider = ({ children }: { children: ReactNode }) => <>{children}</>;

export const useNativeServices = () => servicesMock;

export const useAnalytics = () => analyticsMock;
