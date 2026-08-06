import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { selectSelectedDevice } from '@suite-common/device';
import { WRAPPED_NATIVE, getNetwork, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type WrappedNativeFlowType,
    type YieldFlowDisplayToken,
    selectAccountByKey,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';

import { WrappedNativeTokenReviewContent } from './WrappedNativeTokenReviewContent';
import { buildYieldReviewPreview } from '../utils/yieldReviewOutputUtils';

type StandaloneWrappedNativeReviewProps = {
    accountKey: AccountKey;
    amount: string;
    flowType: WrappedNativeFlowType;
    unsignedTransaction: string;
};

/** Data wiring shared by the standalone wrap and unwrap review screens. */
export const StandaloneWrappedNativeReview = ({
    accountKey,
    amount,
    flowType,
    unsignedTransaction,
}: StandaloneWrappedNativeReviewProps) => {
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const device = useSelector(selectSelectedDevice);

    const wrappedNative = account ? WRAPPED_NATIVE[account.symbol] : undefined;

    const spentToken: YieldFlowDisplayToken | null = useMemo(() => {
        if (!account || !wrappedNative) {
            return null;
        }

        return flowType === 'wrap'
            ? {
                  networkSymbol: account.symbol,
                  symbol: getNetworkDisplaySymbol(account.symbol),
                  decimals: getNetwork(account.symbol).decimals,
                  contractAddress: null,
              }
            : {
                  networkSymbol: account.symbol,
                  symbol: wrappedNative.symbol,
                  decimals: wrappedNative.decimals,
                  contractAddress: wrappedNative.address,
              };
    }, [account, flowType, wrappedNative]);

    const preview = useMemo(() => {
        if (!account || !device || !spentToken) {
            return null;
        }

        return buildYieldReviewPreview({
            account,
            device,
            review: { amount, unsignedTransaction },
            reviewToken: spentToken,
            type: flowType,
        });
    }, [account, amount, device, flowType, spentToken, unsignedTransaction]);

    if (!account || !spentToken || !preview) {
        return null;
    }

    return (
        <WrappedNativeTokenReviewContent
            account={account}
            amount={amount}
            flowType={flowType}
            preview={preview}
            spentToken={spentToken}
            unsignedTransaction={unsignedTransaction}
        />
    );
};
