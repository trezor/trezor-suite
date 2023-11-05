import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { DeviceManager } from '@suite-native/device-manager';
import { updateFiatRatesThunk } from '@suite-native/fiat-rates';
import { selectFiatCurrencyCode } from '@suite-native/module-settings';
import {
    AccountsImportStackParamList,
    AccountsImportStackRoutes,
    RootStackParamList,
    Screen,
    ScreenHeader,
    StackToStackCompositeScreenProps,
} from '@suite-native/navigation';
import TrezorConnect, { AccountInfo } from '@trezor/connect';
import { TokenAddress } from '@suite-common/wallet-types';

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
                    details: 'tokenBalances',
                    suppressBackupWarning: true,
                }),
                dispatch(
                    updateFiatRatesThunk({
                        ticker: {
                            symbol: networkSymbol,
                        },
                        rateType: 'current',
                        localCurrency: fiatCurrency,
                    }),
                ),
            ]);

            if (!ignore) {
                if (fetchedAccountInfo?.success) {
                    if (networkSymbol === 'eth') {
                        fetchedAccountInfo.payload.tokens?.forEach(token => {
                            dispatch(
                                updateFiatRatesThunk({
                                    ticker: {
                                        symbol: 'eth',
                                        tokenAddress: token.contract as TokenAddress,
                                    },
                                    rateType: 'current',
                                    localCurrency: fiatCurrency,
                                }),
                            );
                        });
                    }
                    setAccountInfo(fetchedAccountInfo.payload);
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
        <Screen
            screenHeader={
                <ScreenHeader hasBottomPadding>
                    <DeviceManager />
                </ScreenHeader>
            }
            isScrollable={false}
        >
            <AccountImportLoader />
        </Screen>
    );
};
