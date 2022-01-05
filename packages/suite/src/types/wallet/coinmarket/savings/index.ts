import { AppState } from '@suite-types';
import { SavingsInfo } from '@wallet-actions/coinmarketSavingsActions';
import { SavingsTrade } from '@suite-services/invityAPI';

export interface SavingsComponentProps {
    selectedAccount: AppState['wallet']['selectedAccount'];
}

export interface SavingsProps extends SavingsComponentProps {
    selectedAccount: Extract<SavingsComponentProps['selectedAccount'], { status: 'loaded' }>;
}

export type SavingsContextValues = {
    isLoading: boolean;
    savingsInfo?: SavingsInfo;
    savingsTrade?: SavingsTrade;
    isRegisteredAccount: boolean;
    isClientFromUnsupportedCountry: boolean;
};
