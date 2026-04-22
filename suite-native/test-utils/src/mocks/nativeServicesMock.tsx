import { type ReactNode } from 'react';

const analyticsMock = {
    report: jest.fn(),
    isEnabled: jest.fn(() => true),
    disable: jest.fn(),
    enable: jest.fn(),
    setUrl: jest.fn(),
    setLoggerEnabled: jest.fn(),
    init: jest.fn(),
};

const servicesMock = {
    analytics: analyticsMock,
};

export const NativeServicesProvider = ({ children }: { children: ReactNode }) => <>{children}</>;

export const useNativeServices = jest.fn(() => servicesMock);

export const useAnalytics = jest.fn(() => analyticsMock);
