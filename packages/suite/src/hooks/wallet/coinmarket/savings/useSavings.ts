import { createContext, useEffect } from 'react';
import * as coinmarketCommonActions from '@wallet-actions/coinmarket/coinmarketCommonActions';
import * as coinmarketSavingsActions from '@wallet-actions/coinmarketSavingsActions';
import { useActions, useSelector } from '@suite-hooks';
import { SavingsContextValues } from '@wallet-types/coinmarket/savings';
import invityAPI from '@suite/services/suite/invityAPI';

export const SavingsContext = createContext<SavingsContextValues | null>(null);
SavingsContext.displayName = 'SavingsContext';

export const useSavings = (): SavingsContextValues => {
    // TODO: This shouldSomething doesn't seem to be right. Will decide and maybe later.
    // TODO: Do we really need the InvityAuthentication here?
    // const { invityAuthentication, fetching } = useContext(InvityAuthenticationContext);
    const { savingsInfo, savingsTrade, invityAuthentication } = useSelector(state => ({
        invityAuthentication: state.wallet.coinmarket.invityAuthentication,
        savingsInfo: state.wallet.coinmarket.savings.savingsInfo,
        savingsTrade: state.wallet.coinmarket.savings.savingsTrade,
    }));
    const shouldRegisterUserInfo =
        !!invityAuthentication?.accountInfo?.settings &&
        (!invityAuthentication.accountInfo.settings.givenName ||
            !invityAuthentication.accountInfo.settings.familyName ||
            !invityAuthentication.accountInfo.settings.phoneNumber);

    const shouldVerifyPhoneNumber =
        !!invityAuthentication?.accountInfo &&
        !invityAuthentication.accountInfo.settings?.phoneNumberVerified;

    const shouldKYCStart =
        !shouldVerifyPhoneNumber &&
        !!invityAuthentication?.accountInfo &&
        !!invityAuthentication.accountInfo.settings?.phoneNumberVerified;

    const shouldAML =
        !shouldKYCStart && savingsTrade?.status === 'AML' && savingsTrade.amlStatus === 'Open';

    const { loadInvityData, saveSavingsTradeResponse } = useActions({
        loadInvityData: coinmarketCommonActions.loadInvityData,
        saveSavingsTradeResponse: coinmarketSavingsActions.saveSavingsTradeResponse,
    });
    useEffect(() => {
        loadInvityData();
    }, [loadInvityData]);

    // TODO: rename fetching and isLoading...
    const isLoading = !savingsInfo;

    // We have single savings provider for now.
    const providerInfo = savingsInfo?.savingsList?.providers[0];

    useEffect(() => {
        if (providerInfo && !shouldRegisterUserInfo && !shouldVerifyPhoneNumber) {
            const loadSavingsTrade = async () => {
                const savingsTrade = await invityAPI.getSavingsTrade(providerInfo.name);
                if (savingsTrade) {
                    saveSavingsTradeResponse(savingsTrade);
                }
            };
            loadSavingsTrade();
        }
    }, [providerInfo, saveSavingsTradeResponse, shouldRegisterUserInfo, shouldVerifyPhoneNumber]);

    return {
        invityAuthentication,
        isLoading,
        savingsInfo,
        savingsTrade,
        // TODO: Will be indicated by Invity API later.
        isRegisteredAccount: false,
        isClientFromUnsupportedCountry: !!providerInfo?.isClientFromUnsupportedCountry,
        shouldRegisterUserInfo,
        shouldVerifyPhoneNumber,
        shouldKYCStart,
        shouldAML,
    };
};
