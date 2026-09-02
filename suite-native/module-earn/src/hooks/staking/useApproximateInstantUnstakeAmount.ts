import { useSelector } from 'react-redux';

import { useQuery } from '@suite-common/react-query';
import { simulateUnstake } from '@suite-common/staking';
import { WALLET_SDK_SOURCE_MOBILE } from '@suite-common/wallet-constants';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { isSupportedEthStakingNetworkSymbol } from '@suite-common/wallet-utils';
import { BigNumber, resolveAfter } from '@trezor/utils';

const DEBOUNCE_MS = 300;

export const useApproximateInstantUnstakeAmount = (accountKey: AccountKey, amount: string) => {
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const descriptor = account?.descriptor;
    const symbol = account?.symbol;

    const isAmountValid = !!amount && new BigNumber(amount).gt(0);
    const isQueryEnabled = Boolean(
        descriptor && symbol && isSupportedEthStakingNetworkSymbol(symbol) && isAmountValid,
    );

    // eslint-disable-next-line @tanstack/query/exhaustive-deps -- isAmountValid is derived from amount, which is already part of the key
    const { data: approximatedAmount } = useQuery<string | null>({
        enabled: isQueryEnabled,
        queryKey: ['approximate-instant-unstake-amount', descriptor, symbol, amount],
        queryFn: async ({ signal }) => {
            try {
                await resolveAfter(DEBOUNCE_MS, signal);

                if (
                    !descriptor ||
                    !symbol ||
                    !isSupportedEthStakingNetworkSymbol(symbol) ||
                    !isAmountValid ||
                    signal.aborted
                ) {
                    return null;
                }

                const result = await simulateUnstake({
                    amount,
                    from: descriptor,
                    symbol,
                    source: WALLET_SDK_SOURCE_MOBILE,
                });

                if (signal.aborted || !result || !new BigNumber(result).gt(0)) {
                    return null;
                }

                return result;
            } catch (error) {
                if (__DEV__ && !signal.aborted) {
                    console.warn('simulateUnstake failed', error);
                }

                return null;
            }
        },
        initialData: null,
    });

    return approximatedAmount;
};
