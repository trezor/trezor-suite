import { useCallback, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';

import { type TronFlow, getCurrentVoteAllocations } from '@suite-common/wallet-core';
import { type Account, type TronResourceType } from '@suite-common/wallet-types';
import { type FeeLevel } from '@trezor/connect';
import { useFreshRef } from '@trezor/react-utils';

import { getStakedBalance } from '../unstake/unstakeUtils';

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

export type TronVoteFormAllocation = {
    address: string;
    votes: string;
};

export type TronStakeFormValues = {
    amount: string;
    fiatAmount: string;
    resourceType: TronResourceType;
    selectedFee: FeeLevel['label'];
    voteAllocations: TronVoteFormAllocation[];
};

const getDefaultVoteAllocations = (account: Account): TronVoteFormAllocation[] =>
    getCurrentVoteAllocations(account).map(({ address, count }) => ({
        address,
        votes: String(count),
    }));

interface UseTronStakeFormProps {
    account: Account;
    flow: TronFlow;
}

export const useTronStakeForm = ({ account, flow }: UseTronStakeFormProps) => {
    const methods = useForm<TronStakeFormValues>({
        mode: 'onChange',
        defaultValues: {
            amount: '',
            fiatAmount: '',
            resourceType: getDefaultResourceType({ account, flow }),
            selectedFee: 'normal',
            voteAllocations: getDefaultVoteAllocations(account),
        },
    });

    const accountRef = useFreshRef(account);
    const defaultVoteAllocationsKey = JSON.stringify(getDefaultVoteAllocations(account));

    const hasUserEditedVoteAllocationsRef = useRef(false);

    const markVoteAllocationsEdited = useCallback(() => {
        hasUserEditedVoteAllocationsRef.current = true;
    }, []);

    useEffect(() => {
        if (hasUserEditedVoteAllocationsRef.current) {
            return;
        }

        methods.setValue('voteAllocations', getDefaultVoteAllocations(accountRef.current));
    }, [defaultVoteAllocationsKey, methods, accountRef]);

    return { methods, markVoteAllocationsEdited };
};
