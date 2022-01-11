import { AppState } from '@suite-types';
import { SavingsInfo } from '@wallet-actions/coinmarketSavingsActions';
import { SavingsTrade } from '@suite-services/invityAPI';
import type { WhoAmI } from '@wallet-components/CoinmarketAuthentication';

export interface SavingsComponentProps {
    selectedAccount: AppState['wallet']['selectedAccount'];
}

export type SavingsSelectedAccount = Extract<
    SavingsComponentProps['selectedAccount'],
    { status: 'loaded' }
>;

export interface CoinmarketSavingsLoadedProps {
    selectedAccount: SavingsSelectedAccount;
}

export type SavingsContextValues = {
    invityAuthentication?: WhoAmI; // TODO: temporary for debug
    isLoading: boolean;
    savingsInfo?: SavingsInfo;
    savingsTrade?: SavingsTrade;
    isRegisteredAccount: boolean;
    isClientFromUnsupportedCountry: boolean;
    shouldLogin: boolean;
    shouldRegisterUserInfo: boolean;
    shouldVerifyPhoneNumber: boolean;
    shouldKYCStart: boolean;
};
