import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { selectFiatCurrencyCode } from '@suite-native/module-settings';
import {
    AccountsImportStackParamList,
    AccountsImportStackRoutes,
    RootStackParamList,
    Screen,
    StackToStackCompositeScreenProps,
} from '@suite-native/navigation';
import TrezorConnect, { AccountInfo } from '@trezor/connect';
import { updateFiatRatesThunk } from '@suite-common/wallet-core';
import { Timestamp, TokenAddress } from '@suite-common/wallet-types';

import { AccountImportLoader } from '../components/AccountImportLoader';
import { useShowImportError } from '../useShowImportError';

const LOADING_ANIMATION_DURATION = 5000;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const AccountImportLoadingScreen = ({
    navigation,
    route,
}: StackToStackCompositeScreenProps<
    AccountsImportStackParamList,
    AccountsImportStackRoutes.AccountImportLoading,
    RootStackParamList
>) => {
    const { xpubAddress, networkSymbol } = route.params;
    const dispatch = useDispatch();
    const showImportError = useShowImportError(networkSymbol, navigation);
    const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
    const [isAnimationFinished, setIsAnimationFinished] = useState(false);
    const fiatCurrency = useSelector(selectFiatCurrencyCode);

    useEffect(() => {
        if (accountInfo && isAnimationFinished)
            navigation.navigate(AccountsImportStackRoutes.AccountImportSummary, {
                accountInfo,
                networkSymbol,
            });
    }, [isAnimationFinished, accountInfo, navigation, networkSymbol]);

    useEffect(() => {
        // loader should disappear after 5 seconds soonest by design.
        const timeout = setTimeout(() => setIsAnimationFinished(true), LOADING_ANIMATION_DURATION);

        return () => clearTimeout(timeout);
    }, [setIsAnimationFinished]);

    const safelyShowImportError = useCallback(
        async (message?: string, onRetry?: () => Promise<void>) => {
            // Delay displaying the error message to avoid freezing the app on iOS. If an error occurs too quickly during the
            // transition from ScanQRCodeModalScreen, the error modal won't appear, resulting in a frozen app.
            await sleep(1000);
            showImportError(message, onRetry);
        },
        [showImportError],
    );

    useEffect(() => {
        let ignore = false;

        const getAccountInfo = async () => {
            const [fetchedAccountInfo] = await Promise.all([
                TrezorConnect.getAccountInfo({
                    coin: networkSymbol,
                    descriptor: xpubAddress,
                    details: 'txs',
                    suppressBackupWarning: true,
                }),
                dispatch(
                    updateFiatRatesThunk({
                        ticker: {
                            symbol: networkSymbol,
                        },
                        rateType: 'current',
                        localCurrency: fiatCurrency,
                        fetchAttemptTimestamp: Date.now() as Timestamp,
                    }),
                ),
            ]);

            if (!ignore) {
                if (fetchedAccountInfo?.success) {
                    setAccountInfo(fetchedAccountInfo.payload);

                    //fetch fiat rates for all tokens of newly discovered account
                    fetchedAccountInfo.payload.tokens?.forEach(token =>
                        dispatch(
                            updateFiatRatesThunk({
                                ticker: {
                                    symbol: networkSymbol,
                                    tokenAddress: token.contract as TokenAddress,
                                },
                                rateType: 'current',
                                localCurrency: fiatCurrency,
                                fetchAttemptTimestamp: Date.now() as Timestamp,
                            }),
                        ),
                    );
                } else {
                    safelyShowImportError(fetchedAccountInfo.payload.error, getAccountInfo);
                }
            }
        };
        try {
            getAccountInfo();
        } catch (error) {
            if (!ignore) {
                safelyShowImportError(error?.message, getAccountInfo);
            }
        }

        return () => {
            ignore = true;
        };
    }, [xpubAddress, networkSymbol, dispatch, safelyShowImportError, fiatCurrency]);

    return (
        <Screen isScrollable={false}>
            <AccountImportLoader />
        </Screen>
    );
};
