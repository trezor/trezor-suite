import type { SavingsKYCStatus } from 'invity-api';
import type { WithSelectedAccountLoadedProps } from '@wallet-components';
import type { SavingsContextValues } from './coinmarketSavings';

export type UseSavingsOverviewProps = WithSelectedAccountLoadedProps;

export type SavingsOverviewContextValues = SavingsContextValues & {
    handleEditSetupButtonClick: () => void;
    savingsTradeItemCompletedExists: boolean;
    savingsCryptoSum: string;
    savingsFiatSum: string;
    kycFinalStatus?: SavingsKYCStatus;
    selectedProviderCompanyName?: string;
};
