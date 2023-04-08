import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import TrezorConnect, { AccountInfo } from '@trezor/connect';
import {
    StackToTabCompositeScreenProps,
    Screen,
    AccountsImportStackRoutes,
    RootStackParamList,
    AccountsImportStackParamList,
} from '@suite-native/navigation';
import { updateCurrentFiatRatesThunk } from '@suite-common/wallet-core';

import { AccountImportLoader } from '../components/AccountImportLoader';
import { AccountImportHeader } from '../components/AccountImportHeader';
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
            const fetchedAccountInfo = await TrezorConnect.getAccountInfo({
                coin: networkSymbol,
                descriptor: xpubAddress,
                details: 'txs',
            });

            if (!ignore) {
                if (fetchedAccountInfo?.success) {
                    if (networkSymbol === 'eth') {
                        fetchedAccountInfo.payload.tokens?.forEach(token => {
                            dispatch(
                                updateCurrentFiatRatesThunk({
                                    ticker: {
                                        symbol: token.symbol as string,
                                        mainNetworkSymbol: 'eth',
                                        tokenAddress: token.address,
                                    },
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
    }, [xpubAddress, networkSymbol, dispatch, showImportError]);

    return (
        <Screen header={<AccountImportHeader activeStep={3} />}>
            <AccountImportLoader />
        </Screen>
    );
};
