import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { type RouteProp, useRoute } from '@react-navigation/native';

import { selectSelectedDevice } from '@suite-common/device';
import { WRAPPED_NATIVE, getNetwork, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type YieldFlowDisplayToken,
    selectAccountByKey,
} from '@suite-common/wallet-core';
import {
    type WrappedNativeTokenStackParamList,
    type WrappedNativeTokenStackRoutes,
} from '@suite-native/navigation';

import { WrapNativeTokenReviewContent } from '../components/WrapNativeTokenReviewContent';
import { buildYieldReviewPreview } from '../utils/yieldReviewOutputUtils';

type RouteProps = RouteProp<
    WrappedNativeTokenStackParamList,
    WrappedNativeTokenStackRoutes.WrapNativeTokenReview
>;

export const WrapNativeTokenReviewScreen = () => {
    const route = useRoute<RouteProps>();
    const { accountKey, amount, unsignedTransaction } = route.params;

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const device = useSelector(selectSelectedDevice);

    const wrappedNative = account ? WRAPPED_NATIVE[account.symbol] : undefined;

    const nativeToken: YieldFlowDisplayToken | null = useMemo(
        () =>
            account
                ? {
                      networkSymbol: account.symbol,
                      symbol: getNetworkDisplaySymbol(account.symbol),
                      decimals: getNetwork(account.symbol).decimals,
                      contractAddress: null,
                  }
                : null,
        [account],
    );

    const preview = useMemo(() => {
        if (!account || !device || !nativeToken) {
            return null;
        }

        return buildYieldReviewPreview({
            account,
            device,
            review: { amount, unsignedTransaction },
            reviewToken: nativeToken,
            type: 'wrap',
        });
    }, [account, amount, device, nativeToken, unsignedTransaction]);

    if (!account || !wrappedNative || !nativeToken || !preview) {
        return null;
    }

    return (
        <WrapNativeTokenReviewContent
            account={account}
            amount={amount}
            nativeToken={nativeToken}
            preview={preview}
            unsignedTransaction={unsignedTransaction}
        />
    );
};
