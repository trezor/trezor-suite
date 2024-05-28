import type { SellProviderInfo } from 'invity-api';

export type SpendContextValues = {
    isLoading: boolean;
    noProviders: boolean;
    provider?: SellProviderInfo;
    voucherSiteUrl?: string;
    openWindow: (url?: string) => void;
    setShowLeaveModal: (showLeaveModal: boolean) => void;
};
