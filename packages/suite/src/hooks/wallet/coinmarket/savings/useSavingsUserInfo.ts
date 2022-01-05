import { createContext, useCallback } from 'react';
import {
    SavingsUserInfoFormState,
    SavingsUserInfoContextValues,
} from '@wallet-types/coinmarket/savings/userInfo';
import { useForm } from 'react-hook-form';
import invityAPI, { SavingsTradeRequest } from '@suite/services/suite/invityAPI';
import * as coinmarketSavingsActions from '@wallet-actions/coinmarketSavingsActions';
import { useActions, useSelector } from '@suite-hooks';

export const SavingsContext = createContext<SavingsUserInfoContextValues | null>(null);
SavingsContext.displayName = 'SavingsContext';

export const useSavingsUserInfo = (): SavingsUserInfoContextValues => {
    const { saveSavingsTradeResponse } = useActions({
        saveSavingsTradeResponse: coinmarketSavingsActions.saveSavingsTradeResponse,
    });

    const { savingsTrade } = useSelector(state => ({
        savingsTrade: state.wallet.coinmarket.savings.savingsTrade,
    }));

    const methods = useForm<SavingsUserInfoFormState>({
        mode: 'onChange',
    });
    const { register } = methods;

    const onSubmit = async () => {
        const { familyName, givenName, phoneNumber } = methods.getValues();
        const request: SavingsTradeRequest = {
            trade: {
                ...savingsTrade,
                userRegistration: {
                    familyName,
                    givenName,
                    phoneNumber,
                    dateOfBirth: '2000-01-01', // TODO: temporary - we are discussing if dateOfBirth is mandatory or optional with savings provider
                },
            },
        };
        const response = await invityAPI.doSavingsTrade(request);
        if (response) {
            await invityAPI.sendVerificationSms();
            saveSavingsTradeResponse(response);
        }
    };

    const typedRegister = useCallback(<T>(rules?: T) => register(rules), [register]);

    return {
        ...methods,
        register: typedRegister,
        onSubmit,
    };
};
