import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { type RouteProp, useRoute } from '@react-navigation/native';

import { useFormatters } from '@suite-common/formatters';
import { WRAPPED_NATIVE, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { toTokenSymbol } from '@suite-common/wallet-types';
import { Translation } from '@suite-native/intl';
import {
    type WrappedNativeTokenStackParamList,
    type WrappedNativeTokenStackRoutes,
    useNavigateToInitialScreen,
} from '@suite-native/navigation';

import { YieldCompleteScreenContent } from '../components/YieldCompleteScreenContent';
import { getWrapNativeTokenCompleteRows } from '../components/YieldCompleteScreenPresets';

type RouteProps = RouteProp<
    WrappedNativeTokenStackParamList,
    WrappedNativeTokenStackRoutes.WrapNativeTokenComplete
>;

export const WrapNativeTokenCompleteScreen = () => {
    const route = useRoute<RouteProps>();
    const navigateToInitialScreen = useNavigateToInitialScreen();
    const { CryptoAmountFormatter } = useFormatters();
    const { accountKey, amount } = route.params;

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const wrappedNative = account ? WRAPPED_NATIVE[account.symbol] : undefined;
    const nativeSymbol = account ? getNetworkDisplaySymbol(account.symbol) : '';

    // The wrap form replaced itself with this screen, so this stack holds it alone — any back
    // navigation leaves the whole flow, which is what closing should do. Intercepting it (as the
    // session-driven complete screens do) would only make the interceptor catch its own GO_BACK.
    const handleClose = useCallback(() => {
        navigateToInitialScreen();
    }, [navigateToInitialScreen]);

    const rows = useMemo(() => {
        if (!account || !wrappedNative) {
            return [];
        }

        return getWrapNativeTokenCompleteRows({
            accountSymbol: account.symbol,
            receivedAmount: CryptoAmountFormatter.format(amount, {
                symbol: toTokenSymbol(wrappedNative.symbol),
                isBalance: true,
                withSymbol: true,
                isEllipsisAppended: false,
                maxDisplayedDecimals: 8,
            }),
            receivedTokenContract: wrappedNative.address,
            sentAmount: CryptoAmountFormatter.format(amount, {
                symbol: toTokenSymbol(nativeSymbol),
                isBalance: true,
                withSymbol: true,
                isEllipsisAppended: false,
                maxDisplayedDecimals: 8,
            }),
        });
    }, [CryptoAmountFormatter, account, amount, nativeSymbol, wrappedNative]);

    if (!account || !wrappedNative) {
        return null;
    }

    return (
        <YieldCompleteScreenContent
            buttonTranslationId="earn.wrapNativeToken.closeButton"
            onButtonPress={handleClose}
            rows={rows}
            title={<Translation id="earn.wrapNativeToken.complete.title" />}
            subtitle={
                <Translation
                    id="earn.wrapNativeToken.complete.subtitle"
                    values={{ nativeSymbol, wrappedSymbol: wrappedNative.symbol }}
                />
            }
        />
    );
};
