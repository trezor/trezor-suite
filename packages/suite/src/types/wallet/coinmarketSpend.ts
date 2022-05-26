import type { WithSelectedAccountLoadedProps } from '@wallet-components';
import type { SellProviderInfo } from 'invity-api';

export type UseCoinmarketSpendProps = WithSelectedAccountLoadedProps;

export type Props = WithSelectedAccountLoadedProps;

export type SpendContextValues = {
    isLoading: boolean;
    noProviders: boolean;
    provider?: SellProviderInfo;
    voucherSiteUrl?: string;
    openWindow: (url?: string) => void;
    setShowLeaveModal: (showLeaveModal: boolean) => void;
};
