import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { type RouteProp, useRoute } from '@react-navigation/native';

import { selectSelectedDevice } from '@suite-common/device';
import { WRAPPED_NATIVE } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type YieldFlowDisplayToken,
    selectAccountByKey,
} from '@suite-common/wallet-core';
import {
    type WrappedNativeTokenStackParamList,
    type WrappedNativeTokenStackRoutes,
} from '@suite-native/navigation';

import { WrappedNativeTokenReviewContent } from '../components/WrappedNativeTokenReviewContent';
import { buildYieldReviewPreview } from '../utils/yieldReviewOutputUtils';

type RouteProps = RouteProp<
    WrappedNativeTokenStackParamList,
    WrappedNativeTokenStackRoutes.UnwrapNativeTokenReview
>;

export const UnwrapNativeTokenReviewScreen = () => {
    const route = useRoute<RouteProps>();
    const { accountKey, amount, unsignedTransaction } = route.params;

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const device = useSelector(selectSelectedDevice);

    const wrappedNative = account ? WRAPPED_NATIVE[account.symbol] : undefined;

    const wrappedToken: YieldFlowDisplayToken | null = useMemo(
        () =>
            account && wrappedNative
                ? {
                      networkSymbol: account.symbol,
                      symbol: wrappedNative.symbol,
                      decimals: wrappedNative.decimals,
                      contractAddress: wrappedNative.address,
                  }
                : null,
        [account, wrappedNative],
    );

    const preview = useMemo(() => {
        if (!account || !device || !wrappedToken) {
            return null;
        }

        return buildYieldReviewPreview({
            account,
            device,
            review: { amount, unsignedTransaction },
            reviewToken: wrappedToken,
            type: 'unwrap',
        });
    }, [account, amount, device, unsignedTransaction, wrappedToken]);

    if (!account || !wrappedToken || !preview) {
        return null;
    }

    return (
        <WrappedNativeTokenReviewContent
            account={account}
            amount={amount}
            flowType="unwrap"
            preview={preview}
            spentToken={wrappedToken}
            unsignedTransaction={unsignedTransaction}
        />
    );
};
