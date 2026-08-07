import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { selectSelectedDevice } from '@suite-common/device';
import { getNetwork, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { type WrappedNativeFlowType, type YieldFlowDisplayToken } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { getWrappedNativeToken } from '@trezor/network-ethereum-suite-common';

import { buildYieldReviewPreview } from '../utils/yieldReviewOutputUtils';

type UseWrappedNativeReviewPreviewParams = {
    account: Account | null | undefined;
    amount: string | undefined;
    flowType: WrappedNativeFlowType;
    unsignedTransaction: string | undefined;
};

export const useWrappedNativeReviewPreview = ({
    account,
    amount,
    flowType,
    unsignedTransaction,
}: UseWrappedNativeReviewPreviewParams) => {
    const device = useSelector(selectSelectedDevice);
    const wrappedNative = account ? getWrappedNativeToken(account.symbol) : undefined;

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
        if (!account || !device || !spentToken || amount === undefined || !unsignedTransaction) {
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

    return { preview, spentToken };
};
