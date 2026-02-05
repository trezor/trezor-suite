import { TradingType } from '@suite-common/trading';

import { EventType } from './constants';

export type CountryChangeContextCheck = 'settings' | 'onboarding';
export type CountryChangeContext = Exclude<TradingType, 'exchange'> | CountryChangeContextCheck;
export type CountryChangeAction = 'submitDefault' | 'submitCustom' | 'cancel';

/** @deprecated use `AnalyticsNativeEvents` */
export type SuiteNativeLegacyAnalyticsEvents = {
    type: EventType.PassphraseMismatch;
};
