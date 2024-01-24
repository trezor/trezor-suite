import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from '../suite';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
// @ts-expect-error
import { Ethereum } from '@everstake/wallet-sdk';
import { getEthNetworkForWalletSdk } from 'src/utils/suite/stake';
import { notificationsActions } from '@suite-common/toast-notifications';
import BigNumber from 'bignumber.js';

// TODO: Move to Redux. For demo and testing purposes only, since it requests data every time it's called.
//  This data should be retrieved either via Blockbook or added to account info in Redux in some other way.
export const useClaim = () => {
    const dispatch = useDispatch();
    const selectedAccount = useSelector(selectSelectedAccount);

    const [claim, setClaim] = useState({
        readyForClaim: new BigNumber(0),
        requested: new BigNumber(0),
    });
    useEffect(() => {
        if (!selectedAccount) return;

        const getClaim = async () => {
            try {
                Ethereum.selectNetwork(getEthNetworkForWalletSdk(selectedAccount.symbol));
                const response = await Ethereum.withdrawRequest(selectedAccount.descriptor);

                setClaim(prev => ({
                    ...prev,
                    ...response,
                }));
            } catch (e) {
                console.error(e);
                dispatch(
                    notificationsActions.addToast({
                        type: 'error',
                        error: e.message,
                    }),
                );
            }
        };

        getClaim();
    }, [dispatch, selectedAccount, selectedAccount?.descriptor]);

    const canClaim = claim.readyForClaim.gt(0) && claim.requested.eq(claim.readyForClaim);

    return {
        claim,
        canClaim,
    };
};
