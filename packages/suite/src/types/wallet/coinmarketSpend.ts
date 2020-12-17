import { AppState } from '@suite-types';
import { SellProviderInfo } from 'invity-api';
import { Account, Network } from '@wallet-types';

export interface ComponentProps {
    selectedAccount: AppState['wallet']['selectedAccount'];
    device: AppState['suite']['device'];
    language: AppState['suite']['settings']['language'];
    fees: AppState['wallet']['fees'];
}

export interface Props extends ComponentProps {
    selectedAccount: Extract<ComponentProps['selectedAccount'], { status: 'loaded' }>;
}

export type SpendContextValues = {
    account: Account;
    isLoading: boolean;
    noProviders: boolean;
    network: Network;
    provider?: SellProviderInfo;
    voucherSiteUrl?: string;
    openWindow: (url?: string) => void;
    setShowLeaveModal: (showLeaveModal: boolean) => void;
};
