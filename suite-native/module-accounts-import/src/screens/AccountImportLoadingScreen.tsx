import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { TokenAddress, TokenSymbol } from '@suite-common/wallet-types';
import { updateFiatRatesThunk } from '@suite-native/fiat-rates';
import { selectFiatCurrencyCode } from '@suite-native/module-settings';
import {
    AccountsImportStackParamList,
    AccountsImportStackRoutes,
    RootStackParamList,
    Screen,
    StackToTabCompositeScreenProps,
} from '@suite-native/navigation';
import TrezorConnect, { AccountInfo } from '@trezor/connect';

import { AccountImportHeader } from '../components/AccountImportHeader';
import { AccountImportLoader } from '../components/AccountImportLoader';
import { useShowImportError } from '../useShowImportError';

const LOADING_ANIMATION_DURATION = 5000;

export const AccountImportLoadingScreen = ({
    navigation,
    route,
}: StackToTabCompositeScreenProps<
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

    useEffect(() => {
        let ignore = false;

        const getAccountInfo = async () => {
            const [fetchedAccountInfo] = await Promise.all([
                TrezorConnect.getAccountInfo({
                    coin: networkSymbol,
                    descriptor: xpubAddress,
                    details: 'tokenBalances',
                }),
                dispatch(
                    // @ts-expect-error Seems there is a problem with global types do dispatch, no idea how to fix it
                    updateFiatRatesThunk({
                        ticker: {
                            symbol: networkSymbol,
                        },
                        rateType: 'current',
                        fiatCurrency,
                    }),
                ),
            ]);

            if (!ignore) {
                if (fetchedAccountInfo?.success) {
                    if (networkSymbol === 'eth') {
                        fetchedAccountInfo.payload.tokens?.forEach(token => {
                            dispatch(
                                // @ts-expect-error Seems there is a problem with global types do dispatch, no idea how to fix it
                                updateFiatRatesThunk({
                                    ticker: {
                                        symbol: token.symbol as TokenSymbol,
                                        mainNetworkSymbol: 'eth',
                                        tokenAddress: token.address as TokenAddress,
                                    },
                                    rateType: 'current',
                                    fiatCurrency,
                                }),
                            );
                        });
                    }
                    setAccountInfo(fetchedAccountInfo.payload);
                } else {
                    showImportError(fetchedAccountInfo.payload.error, getAccountInfo);
                }
            }
        };
        try {
            getAccountInfo();
        } catch (error) {
            if (!ignore) {
                showImportError(error?.message, getAccountInfo);
            }
        }

        return () => {
            ignore = true;
        };
    }, [xpubAddress, networkSymbol, dispatch, showImportError, fiatCurrency]);

    return (
        <Screen header={<AccountImportHeader activeStep={3} />}>
            <AccountImportLoader />
        </Screen>
    );
};
