import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { selectDeviceId } from '@suite-common/device';
import { type ReferralVoucher, fetchReferralAccountThunk } from '@suite-common/refer-a-friend';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { selectReferAFriendVouchers } from '../selectors';

export type VoucherStatus = 'pending' | 'ready' | 'used' | 'canceled' | 'expired';

export type Voucher = (
    | { status: 'ready' | 'used' | 'expired'; code: string }
    | { status: 'pending' | 'canceled'; code: null }
) & {
    amount: number;
    // fiatCurrency: 'USD';
    // orderPaidAt: '2026-09-15T15:30:00Z';
    // readyAt: '2026-10-15T00:00:00Z';
    expiresAt: Date | null;
    // usedAt: null;
};

export const useReferAFriendVouchers = (): ReferralVoucher[] => {
    const { dispatch } = useServices(injectDispatch);

    const deviceId = useSelector(selectDeviceId);
    const vouchers = useSelector(selectReferAFriendVouchers);

    useEffect(() => {
        if (deviceId) {
            dispatch(fetchReferralAccountThunk({ deviceId }));
        }
    }, [dispatch, deviceId]);

    return vouchers;
};

export const getVoucherStats = (vouchers: ReferralVoucher[]) => {
    const available = vouchers.filter(({ status }) => status === 'available');

    return {
        totalEarned: `$${available.reduce((totalEarned, voucher) => totalEarned + voucher.amount, 0)}`,
        vouchers: available.length,
        referrals: vouchers.length,
    };
};
