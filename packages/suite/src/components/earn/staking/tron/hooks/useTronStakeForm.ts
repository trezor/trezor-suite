import { useForm } from 'react-hook-form';

import { useTranslation } from '@suite/intl';
import { getNetwork } from '@suite-common/wallet-config';
import { type TronResourceType } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { type FeeLevel } from '@trezor/connect';

import {
    validateDecimals,
    validateMin,
    validateReserveOrBalance,
} from 'src/utils/suite/validation';

export type TronStakeFormValues = {
    amount: string;
    resourceType: TronResourceType;
    selectedFee: FeeLevel['label'];
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

    return {
        methods,
        amountRules,
    };
};
