import { useForm } from 'react-hook-form';

import { useTranslation } from '@suite/intl';
import { isAddressValid } from '@suite-common/address';
import { getNetwork } from '@suite-common/wallet-config';
import { type TronResourceType } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { type FeeLevel } from '@trezor/connect';

import {
    validateDecimals,
    validateMin,
    validateReserveOrBalance,
} from 'src/utils/suite/validation';

import { CUSTOM_REPRESENTATIVE } from '../vote/constants';

export type TronStakeFormValues = {
    amount: string;
    resourceType: TronResourceType;
    selectedFee: FeeLevel['label'];
    representative: string;
    customRepresentativeAddress: string;
};

interface UseTronStakeFormProps {
    account: Account;
}

export const useTronStakeForm = ({ account }: UseTronStakeFormProps) => {
    const { translationString } = useTranslation();

    const methods = useForm<TronStakeFormValues>({
        mode: 'onChange',
        defaultValues: {
            amount: '',
            resourceType: 'bandwidth',
            selectedFee: 'normal',
            representative: '',
            customRepresentativeAddress: '',
        },
    });

    const amountRules = {
        required: translationString('AMOUNT_IS_NOT_SET'),
        validate: {
            min: validateMin(translationString),
            decimals: validateDecimals(translationString, {
                decimals: getNetwork(account.symbol).decimals,
            }),
            reserveOrBalance: validateReserveOrBalance(translationString, { account }),
        },
    };

    const customRepresentativeRules = {
        validate: {
            validAddress: (value: string, { representative }: TronStakeFormValues) => {
                if (representative !== CUSTOM_REPRESENTATIVE || !value.trim()) {
                    return true;
                }

                return (
                    isAddressValid(value.trim(), account.symbol) ||
                    translationString('RECIPIENT_IS_NOT_VALID')
                );
            },
        },
    };

    return {
        methods,
        amountRules,
        customRepresentativeRules,
    };
};
