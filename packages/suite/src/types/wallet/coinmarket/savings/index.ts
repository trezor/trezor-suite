import type { SavingsInfo } from '@wallet-actions/coinmarketSavingsActions';
import type { SavingsTrade } from '@suite-services/invityAPI';
import type { WhoAmI } from '@wallet-components/InvityAuthentication';
import type { WithSelectedAccountLoadedProps } from '@suite/components/wallet';

export type UseSavingsProps = WithSelectedAccountLoadedProps;

export type SavingsContextValues = {
    invityAuthentication?: WhoAmI; // TODO: temporary for debug
    isLoading: boolean;
    savingsInfo?: SavingsInfo;
    savingsTrade?: SavingsTrade;
    isRegisteredAccount: boolean;
    isClientFromUnsupportedCountry: boolean;
    shouldRegisterUserInfo: boolean;
    shouldVerifyPhoneNumber: boolean;
    shouldKYCStart: boolean;
    shouldAML: boolean;
};
