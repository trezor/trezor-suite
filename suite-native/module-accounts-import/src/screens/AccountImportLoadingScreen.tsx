import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { selectFiatCurrencyCode } from '@suite-native/settings';
import {
    AccountsImportStackParamList,
    AccountsImportStackRoutes,
    RootStackParamList,
    Screen,
    StackToStackCompositeScreenProps,
} from '@suite-native/navigation';
import { AccountInfo } from '@trezor/connect';
import { SpinnerLoadingState } from '@suite-native/atoms';

import { AccountImportLoader } from '../components/AccountImportLoader';
import { useShowImportError } from '../useShowImportError';
import { getAccountInfoThunk } from '../accountsImportThunks';

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
    const fiatCurrency = useSelector(selectFiatCurrencyCode);
    const [error, setError] = useState<string>();
    const [accountInfoFetchResult, setAccountInfoFetchResult] =
        useState<SpinnerLoadingState>('idle');

    const fetchAccountInfo = useCallback(async () => {
        try {
            const response = await dispatch(
                getAccountInfoThunk({ networkSymbol, fiatCurrency, xpubAddress }),
            ).unwrap();

            if (response) {
                setAccountInfo(response);
                setAccountInfoFetchResult('success');
            }
        } catch (response) {
            setError(response);
            setAccountInfoFetchResult('error');
        }
    }, [dispatch, fiatCurrency, networkSymbol, xpubAddress]);

    const safelyShowImportError = useCallback(
        async (onRetry?: () => Promise<void>) => {
            // Delay displaying the error message to avoid freezing the app on iOS. If an error occurs too quickly during the
            // transition from ScanQRCodeModalScreen, the error modal won't appear, resulting in a frozen app.
            await sleep(1000);
            showImportError(error, () => {
                if (!onRetry) return;
                onRetry();

                // This is needed because handleResult calls safelyShowImportError, which calls handleResult,
                // so one of them is always going to be used before it was defined. However, the functionality is fine here so it's not a problem.
                // eslint-disable-next-line @typescript-eslint/no-use-before-define
                handleResult();
            });
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [error, showImportError],
    );

    useEffect(() => {
        fetchAccountInfo();
    }, [fetchAccountInfo]);

    const handleResult = () => {
        if (error || !accountInfo) {
            safelyShowImportError(fetchAccountInfo);
        } else {
            navigation.navigate(AccountsImportStackRoutes.AccountImportSummary, {
                accountInfo,
                networkSymbol,
            });
        }
    };

    return (
        <Screen isScrollable={false}>
            <AccountImportLoader loadingState={accountInfoFetchResult} onComplete={handleResult} />
        </Screen>
    );
};
