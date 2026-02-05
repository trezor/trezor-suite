import { TradingType } from '@suite-common/trading';

export type CountryChangeContextCheck = 'settings' | 'onboarding';
export type CountryChangeContext = Exclude<TradingType, 'exchange'> | CountryChangeContextCheck;
export type CountryChangeAction = 'submitDefault' | 'submitCustom' | 'cancel';

/** @deprecated use `AnalyticsNativeEvents` */
export type SuiteNativeLegacyAnalyticsEvents = never;
