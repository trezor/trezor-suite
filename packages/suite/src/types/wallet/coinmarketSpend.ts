import { AppState } from '@suite-types';
import { SellProviderInfo } from 'invity-api';
import { WithDeviceConnectedProps } from '@wallet-views/coinmarket/hoc/withDeviceConnected';

export interface ComponentProps {
    selectedAccount: AppState['wallet']['selectedAccount'];
    device: AppState['suite']['device'];
    language: AppState['suite']['settings']['language'];
    fees: AppState['wallet']['fees'];
}

export interface Props extends ComponentProps, WithDeviceConnectedProps {
    selectedAccount: Extract<ComponentProps['selectedAccount'], { status: 'loaded' }>;
}

export type SpendContextValues = {
    isLoading: boolean;
    noProviders: boolean;
    provider?: SellProviderInfo;
    voucherSiteUrl?: string;
    openWindow: (url?: string) => void;
    setShowLeaveModal: (showLeaveModal: boolean) => void;
};
