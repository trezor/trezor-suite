import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { WRAPPED_NATIVE, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type WrappedNativeFlowType,
    selectAccountByKey,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { selectNativeAnalyticsDep } from '@suite-native/analytics';
import { Translation, type TxKeyPath, selectSupportedLanguageLocale } from '@suite-native/intl';
import { useNavigateToInitialScreen } from '@suite-native/navigation';

import { YieldCompleteScreenContent } from './YieldCompleteScreenContent';
import { getWrappedNativeCompleteRows } from './YieldCompleteScreenPresets';
import { formatEarnTokenAmount } from '../utils/earnAmountUtils';

type WrappedNativeTokenCompleteContentProps = {
    accountKey: AccountKey;
    amount: string;
    flowType: WrappedNativeFlowType;
};

const flowMessages = {
    wrap: {
        closeButton: 'earn.wrapNativeToken.closeButton',
        subtitle: 'earn.wrapNativeToken.complete.subtitle',
        title: 'earn.wrapNativeToken.complete.title',
    },
    unwrap: {
        closeButton: 'earn.unwrapNativeToken.closeButton',
        subtitle: 'earn.unwrapNativeToken.complete.subtitle',
        title: 'earn.unwrapNativeToken.complete.title',
    },
} satisfies Record<WrappedNativeFlowType, Record<'closeButton' | 'subtitle' | 'title', TxKeyPath>>;

export const WrappedNativeTokenCompleteContent = ({
    accountKey,
    amount,
    flowType,
}: WrappedNativeTokenCompleteContentProps) => {
    const navigateToInitialScreen = useNavigateToInitialScreen();
    const locale = useSelector(selectSupportedLanguageLocale);
    const { analytics } = useServices(selectNativeAnalyticsDep);

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const wrappedNative = account ? WRAPPED_NATIVE[account.symbol] : undefined;
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

        const formatAmount = (symbol: string) => formatEarnTokenAmount({ amount, locale, symbol });

        return getWrappedNativeCompleteRows({
            accountSymbol: account.symbol,
            receivedAmount: formatAmount(flowType === 'wrap' ? wrappedNative.symbol : nativeSymbol),
            receivedTokenContract: flowType === 'wrap' ? wrappedNative.address : undefined,
            sentAmount: formatAmount(flowType === 'wrap' ? nativeSymbol : wrappedNative.symbol),
            sentTokenContract: flowType === 'wrap' ? undefined : wrappedNative.address,
        });
    }, [account, amount, flowType, locale, nativeSymbol, wrappedNative]);

    if (!account || !wrappedNative) {
        return null;
    }

    return (
        <YieldCompleteScreenContent
            buttonTranslationId={flowMessages[flowType].closeButton}
            onButtonPress={handleClose}
            rows={rows}
            title={<Translation id={flowMessages[flowType].title} />}
            subtitle={
                <Translation
                    id={flowMessages[flowType].subtitle}
                    values={{ nativeSymbol, wrappedSymbol: wrappedNative.symbol }}
                />
            }
        />
    );
};
