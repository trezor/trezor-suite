import { useEffect, useMemo, useState } from 'react';

import {
    composeTronFreezeFeeLevelsThunk,
    selectRawNetworkFeeInfo,
} from '@suite-common/wallet-core';
import { type Account, type FeeInfo, type PrecomposedLevels } from '@suite-common/wallet-types';
import { getConvertedOrDefaultFeeInfo } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { useDispatch, useSelector } from 'src/hooks/suite';

import { useTronStakeContext } from '../TronStakeContext';

interface UseTronStakeFeesProps {
    account: Account;
}

interface TronStakeFees {
    feeInfo: FeeInfo;
    composedLevels: PrecomposedLevels | undefined;
}

export const useTronStakeFees = ({ account }: UseTronStakeFeesProps): TronStakeFees => {
    const dispatch = useDispatch();
    const { form } = useTronStakeContext();

    const amount = form.methods.watch('amount');
    const resourceType = form.methods.watch('resourceType');

    const rawFeeInfo = useSelector(state => selectRawNetworkFeeInfo(state, account.symbol));
    const feeInfo = useMemo(
        () =>
            getConvertedOrDefaultFeeInfo({ networkType: account.networkType, feeInfo: rawFeeInfo }),
        [account.networkType, rawFeeInfo],
    );

    const [composedLevels, setComposedLevels] = useState<PrecomposedLevels | undefined>(undefined);

    useEffect(() => {
        const amountValue = new BigNumber(amount);

        if (!amountValue.isFinite() || amountValue.lte(0)) {
            setComposedLevels(undefined);

            return;
        }

        let active = true;

        const compose = async () => {
            const levels = await dispatch(
                composeTronFreezeFeeLevelsThunk({ account, amount, resourceType }),
            )
                .unwrap()
                .catch(() => undefined);

            if (active) {
                setComposedLevels(levels);
            }
        };

        void compose();

        return () => {
            active = false;
        };
    }, [account, amount, resourceType, dispatch]);

    return { feeInfo, composedLevels };
};
