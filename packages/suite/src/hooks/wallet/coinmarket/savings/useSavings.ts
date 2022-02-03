import { createContext, useEffect } from 'react';
import * as coinmarketCommonActions from '@wallet-actions/coinmarket/coinmarketCommonActions';
import * as coinmarketSavingsActions from '@wallet-actions/coinmarketSavingsActions';
import { useActions, useSelector } from '@suite-hooks';
import { SavingsContextValues } from '@wallet-types/coinmarket/savings';
import invityAPI from '@suite/services/suite/invityAPI';

export const SavingsContext = createContext<SavingsContextValues | null>(null);
SavingsContext.displayName = 'SavingsContext';

// TODO: Find out if this hook is used or useful
export const useSavings = (): SavingsContextValues => {
    // TODO: This shouldSomething doesn't seem to be right. Will decide and maybe later.
    // TODO: Do we really need the InvityAuthentication here?
    // const { invityAuthentication, fetching } = useContext(InvityAuthenticationContext);
    const { savingsInfo, savingsTrade, invityAuthentication, selectedProvider } = useSelector(
        state => ({
            invityAuthentication: state.wallet.coinmarket.invityAuthentication,
            savingsInfo: state.wallet.coinmarket.savings.savingsInfo,
            selectedProvider: state.wallet.coinmarket.savings.selectedProvider,
            savingsTrade: state.wallet.coinmarket.savings.savingsTrade,
        }),
    );
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

    useEffect(() => {
        if (selectedProvider && shouldKYCStart) {
            const loadSavingsTrade = async () => {
                const savingsTrade = await invityAPI.getSavingsTrade(selectedProvider.name);
                if (savingsTrade) {
                    saveSavingsTradeResponse(savingsTrade);
                }
            };
            loadSavingsTrade();
        }
    }, [selectedProvider, saveSavingsTradeResponse, shouldKYCStart]);

    return {
        invityAuthentication,
        isLoading,
        savingsInfo,
        savingsTrade,
        // TODO: Will be indicated by Invity API later.
        isRegisteredAccount: false,
        isClientFromUnsupportedCountry: !!selectedProvider?.isClientFromUnsupportedCountry,
        shouldRegisterUserInfo,
        shouldVerifyPhoneNumber,
        shouldKYCStart,
        shouldAML,
    };
};
