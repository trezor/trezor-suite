import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { selectDeviceId } from '@suite-common/device';
import {
    type ReferralVoucher,
    fetchReferralAccountThunk,
    fetchReferralProgramThunk,
    selectReferralProgram,
} from '@suite-common/refer-a-friend';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { selectReferAFriendAccount } from '../selectors';

export type ProgramProps = {
    rewardAmount: string;
    friendDiscountPercentage: number;
    minimumOrderAmount: string;
    redemptionLimit: string;
    annualReferralLimit: number;
    annualRewardLimit: string;
};

export type VoucherStats = {
    totalEarned: string;
    availableVouchers: number;
};

export type VoucherProps = Omit<ReferralVoucher, 'amount'> & {
    amount: string;
};

export const useReferAFriend = () => {
    const { dispatch } = useServices(injectDispatch);

    const deviceId = useSelector(selectDeviceId);
    const programState = useSelector(selectReferralProgram);
    const accountState = useSelector(selectReferAFriendAccount);

    useEffect(() => {
        if (deviceId) {
            dispatch(fetchReferralProgramThunk());
            dispatch(fetchReferralAccountThunk({ deviceId }));
        }
    }, [dispatch, deviceId]);

    if (!programState.data) {
        return null;
    }

    const {
        fiatCurrency,
        rewardAmount,
        friendDiscountPercentage,
        minimumOrderAmount,
        redemptionLimit,
    } = programState.data;
    const { account, vouchers } = accountState;

    const currencyFormatter = Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: fiatCurrency,
        maximumFractionDigits: 0,
    });

    const allVouchers = vouchers ?? [];
    const availableVouchers = allVouchers.filter(({ status }) => status === 'available');

    return {
        program: {
            rewardAmount: currencyFormatter.format(rewardAmount),
            friendDiscountPercentage,
            minimumOrderAmount: currencyFormatter.format(minimumOrderAmount),
            redemptionLimit: currencyFormatter.format(redemptionLimit),
            annualReferralLimit: 50,
            annualRewardLimit: currencyFormatter.format(1000),
        },
        referralLink: account?.shareUrl,
        stats: {
            totalEarned: `$${availableVouchers.reduce((totalEarned, voucher) => totalEarned + voucher.amount, 0)}`,
            availableVouchers: availableVouchers.length,
        },
        vouchers: allVouchers.map(({ amount, ...rest }) => ({
            amount: currencyFormatter.format(amount),
            ...rest,
        })),
    };
};
