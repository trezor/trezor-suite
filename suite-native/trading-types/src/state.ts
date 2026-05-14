import type { ProviderMetadata } from 'invity-api';

import type {
    TradingState as CommonTradingState,
    InvityServerEnvironment,
    TradingCountryCode,
    TradingTypeWithConcierge,
} from '@suite-common/trading';

import type { ProviderConfirmationStatus } from './general';

export type TradingResidenceState = {
    country: TradingCountryCode | undefined;
    countrySubdivision: string | undefined;
    wasOnboardingVisited: boolean;
};

export type TradingResidenceRootState = {
    wallet: {
        trading: {
            residence: TradingResidenceState;
        };
    };
};

export interface TradingState extends CommonTradingState {
    residence: TradingResidenceState;
    tradingEnvironment: InvityServerEnvironment;
    tradeOrderIdToBeOpened: string | undefined;
    isAmountInputActive: boolean;
    activeTradingType: TradingTypeWithConcierge | undefined;
    providerConfirmationStatus: ProviderConfirmationStatus;
    currentProviderMetadata: ProviderMetadata | undefined;
}

export type TradingRootState = {
    wallet: {
        trading: TradingState;
    };
};
