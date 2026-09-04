import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type WrappedNativeFlowType,
    selectAccountByKey,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { selectNativeAnalyticsDep } from '@suite-native/analytics';
import { Translation } from '@suite-native/intl';
import { useNavigateToInitialScreen } from '@suite-native/navigation';
import { getWrappedNativeToken } from '@trezor/network-ethereum-suite-common';

import { EarnCompleteScreenContent } from './EarnCompleteScreenContent';
import { wrappedNativeFlowMessages } from '../../utils/earn/wrappedNativeFlowMessages';
import { getWrappedNativeCompleteRows } from '../yield/YieldCompleteScreenPresets';

type WrappedNativeTokenCompleteContentProps = {
    accountKey: AccountKey;
    amount: string;
    flowType: WrappedNativeFlowType;
};

export const WrappedNativeTokenCompleteContent = ({
    accountKey,
    amount,
    flowType,
}: WrappedNativeTokenCompleteContentProps) => {
    const navigateToInitialScreen = useNavigateToInitialScreen();
    const { analytics } = useServices(selectNativeAnalyticsDep);

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const wrappedNative = account ? getWrappedNativeToken(account.symbol) : undefined;
    const nativeSymbol = account ? getNetworkDisplaySymbol(account.symbol) : '';

    // The form replaced itself with this screen, so this stack holds it alone — any back
    // navigation leaves the whole flow, which is what closing should do. Intercepting it (as the
    // session-driven complete screens do) or watching it with useNavigateBackAnalytics would only
    // catch the GO_BACK this very handler dispatches, so it reports the `continue` itself.
    const handleClose = useCallback(() => {
        analytics.report({
            type: events.yieldNavigateEvent.name,
            payload: {
                action: 'continue',
                from: flowType === 'wrap' ? 'wrap-form' : 'unwrap-form',
                to: 'account-detail',
                networkSymbol: account?.symbol,
            },
        });

        navigateToInitialScreen();
    }, [account?.symbol, analytics, flowType, navigateToInitialScreen]);

    const rows = useMemo(() => {
        if (!account || !wrappedNative) {
            return [];
        }

        return getWrappedNativeCompleteRows({
            accountSymbol: account.symbol,
            receivedAmount: {
                value: amount,
                tokenContract: flowType === 'wrap' ? wrappedNative.address : undefined,
                tokenDecimals: flowType === 'wrap' ? wrappedNative.decimals : undefined,
                tokenSymbol: flowType === 'wrap' ? wrappedNative.symbol : undefined,
            },
            sentAmount: {
                value: amount,
                tokenContract: flowType === 'wrap' ? undefined : wrappedNative.address,
                tokenDecimals: flowType === 'wrap' ? undefined : wrappedNative.decimals,
                tokenSymbol: flowType === 'wrap' ? undefined : wrappedNative.symbol,
            },
        });
    }, [account, amount, flowType, wrappedNative]);

    if (!account || !wrappedNative) {
        return null;
    }

    const messages = wrappedNativeFlowMessages[flowType].complete;

    return (
        <EarnCompleteScreenContent
            type={flowType}
            buttonTranslationId={messages.closeButton}
            onButtonPress={handleClose}
            rows={rows}
            title={<Translation id={messages.title} />}
            subtitle={
                <Translation
                    id={messages.subtitle}
                    values={{ nativeSymbol, wrappedSymbol: wrappedNative.symbol }}
                />
            }
        />
    );
};
