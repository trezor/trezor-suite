import { useForm } from 'react-hook-form';

import { useTranslation } from '@suite/intl';
import { isAddressValid } from '@suite-common/address';
import { getNetwork } from '@suite-common/wallet-config';
import { type TronFlow } from '@suite-common/wallet-core';
import { type Account, type TronResourceType } from '@suite-common/wallet-types';
import { getStakingLimitsByNetworkSymbol } from '@suite-common/wallet-utils';
import { type FeeLevel } from '@trezor/connect';

import {
    validateDecimals,
    validateMin,
    validateReserveOrBalance,
} from 'src/utils/suite/validation';

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
            resourceType: getDefaultResourceType({ account, flow }),
            selectedFee: 'normal',
            representative: '',
            customRepresentativeAddress: '',
        },
    });

    const stakingLimits = getStakingLimitsByNetworkSymbol(account.symbol);
    const minStakingAmount = stakingLimits?.MIN_AMOUNT_FOR_STAKING;

    const { displaySymbol } = getNetwork(account.symbol);

    const amountRules = {
        required: translationString('AMOUNT_IS_NOT_SET'),
        validate: {
            min: validateMin(translationString),
            minStakingAmount: (value: string) => {
                if (value && minStakingAmount?.isGreaterThan(value)) {
                    return translationString('TR_EARN_STAKING_DASHBOARD_MINIMUM_STAKE', {
                        amount: minStakingAmount.toString(),
                        displaySymbol,
                    });
                }
            },
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
