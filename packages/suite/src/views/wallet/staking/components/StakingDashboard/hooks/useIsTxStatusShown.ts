import { useEffect, useRef, useState } from 'react';

import { BigNumber } from '@trezor/utils/src/bigNumber';

export const useIsTxStatusShown = (totalPendingStake: BigNumber, accountDescriptor?: string) => {
    // Handling the edge case, when a user can witness sudden change of pending stake deposit to 0.
    // In this case they should see the "Adding to staking pool" progress label as complete and
    // the "Staked & earning rewards" label as active for a few seconds.
    const [isTxStatusShown, setIsTxStatusShown] = useState(false);
    const prevTotalDeposited = useRef(totalPendingStake);

    // reset on account change
    useEffect(() => {
        prevTotalDeposited.current = new BigNumber(0);
    }, [accountDescriptor]);

    useEffect(() => {
        if (totalPendingStake.gt(0)) {
            prevTotalDeposited.current = totalPendingStake;
            setIsTxStatusShown(true);

            return;
        }

        const hideTxStatuses = () => {
            prevTotalDeposited.current = new BigNumber(0);
            setIsTxStatusShown(false);
        };

        if (prevTotalDeposited.current.gt(0)) {
            const timeoutId = setTimeout(() => {
                hideTxStatuses();
            }, 7000);

            return () => clearTimeout(timeoutId);
        }

        hideTxStatuses();
    }, [totalPendingStake]);

    return { isTxStatusShown };
};
