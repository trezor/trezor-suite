import type { SavingsTrade, SavingsTradePayment } from '@suite-services/invityAPI';
import type { WithSelectedAccountLoadedProps } from '@wallet-components';

export type UseSavingsOverviewProps = WithSelectedAccountLoadedProps;

export type SavingsOverviewContextValues = {
    savingsTrade: SavingsTrade | undefined;
    savingsTradePayments: SavingsTradePayment[] | undefined;
    handleEditSetupButtonClick: () => void;
};
