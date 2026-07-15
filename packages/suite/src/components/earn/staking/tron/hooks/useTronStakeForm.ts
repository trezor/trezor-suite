import { useForm } from 'react-hook-form';

import { useTranslation } from '@suite/intl';
import { isAddressValid } from '@suite-common/address';
import { type TronFlow } from '@suite-common/wallet-core';
import { type Account, type TronResourceType } from '@suite-common/wallet-types';
import { type FeeLevel } from '@trezor/connect';

import { getStakedBalance } from '../unstake/unstakeUtils';
import { CUSTOM_REPRESENTATIVE } from '../vote/constants';

interface GetDefaultResourceTypeProps {
    account: Account;
    flow: TronFlow;
}

const getDefaultResourceType = ({ account, flow }: GetDefaultResourceTypeProps) => {
    if (flow !== 'unstake') {
        return 'bandwidth';
    }

    const stakedBandwidthBalance = getStakedBalance(account, 'bandwidth');

    return stakedBandwidthBalance === '0' ? 'energy' : 'bandwidth';
};

export type TronStakeFormValues = {
    amount: string;
    fiatAmount: string;
    resourceType: TronResourceType;
    selectedFee: FeeLevel['label'];
    representative: string;
    customRepresentativeAddress: string;
};

interface UseTronStakeFormProps {
    account: Account;
    flow: TronFlow;
}

export const useTronStakeForm = ({ account, flow }: UseTronStakeFormProps) => {
    const { translationString } = useTranslation();

    const methods = useForm<TronStakeFormValues>({
        mode: 'onChange',
        defaultValues: {
            amount: '',
            fiatAmount: '',
            resourceType: getDefaultResourceType({ account, flow }),
            selectedFee: 'normal',
            representative: '',
            customRepresentativeAddress: '',
        },
    });

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
        customRepresentativeRules,
    };
};
