import type { SavingsTrade, SavingsTradePlannedPayment } from '@suite-services/invityAPI';
import type { WithSelectedAccountLoadedProps } from '@wallet-components';

export type UseSavingsOverviewProps = WithSelectedAccountLoadedProps;

export type SavingsOverviewContextValues = {
    savingsTrade: SavingsTrade | undefined;
    savingsTradePayments: SavingsTradePlannedPayment[] | undefined;
    handleEditSetupButtonClick: () => void;
};
