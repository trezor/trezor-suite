import { useEffect } from 'react';

import { goto, selectRouteName } from '@suite/router';
import { selectSelectedDevice } from '@suite-common/device';
import {
    addSparkAccountThunk,
    loadSparkWalletThunk,
    refreshSparkLightningInvoiceThunk,
    selectIsSparkEnabled,
    selectSelectedSparkAccount,
    selectSelectedSparkAccountNumber,
    selectSparkAccountsByWalletDescriptor,
    selectSparkWalletByAccountNumber,
    sparkActions,
    submitSparkLightningSendThunk,
} from '@suite-common/spark';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';

import { useDispatch, useSelector } from 'src/hooks/suite';

type SparkRouteName = 'spark-index' | 'spark-send' | 'spark-receive';

const isSparkRouteName = (routeName: string | undefined): routeName is SparkRouteName =>
    routeName === 'spark-index' || routeName === 'spark-send' || routeName === 'spark-receive';

export const useSparkWallet = () => {
    const dispatch = useDispatch();
    const device = useSelector(selectSelectedDevice);
    const routeName = useSelector(selectRouteName);
    const isEnabled = useSelector(selectIsSparkEnabled);
    const deviceStaticSessionId = device?.state?.staticSessionId;
    const walletDescriptor = deviceStaticSessionId
        ? parseDeviceStaticSessionId(deviceStaticSessionId).walletDescriptor
        : null;
    const accounts = useSelector(state =>
        walletDescriptor ? selectSparkAccountsByWalletDescriptor(state, walletDescriptor) : [],
    );
    const selectedAccountNumber = useSelector(state =>
        walletDescriptor ? selectSelectedSparkAccountNumber(state, walletDescriptor) : undefined,
    );
    const selectedAccount = useSelector(state =>
        walletDescriptor ? selectSelectedSparkAccount(state, walletDescriptor) : undefined,
    );
    const wallet = useSelector(state =>
        walletDescriptor && selectedAccount
            ? selectSparkWalletByAccountNumber(state, {
                  accountNumber: selectedAccount.accountNumber,
                  walletDescriptor,
              })
            : undefined,
    );

    const currentSparkRouteName: SparkRouteName = isSparkRouteName(routeName)
        ? routeName
        : 'spark-index';

    useEffect(() => {
        if (!isEnabled || !deviceStaticSessionId || !walletDescriptor || !selectedAccount) {
            return;
        }

        if (wallet?.status === 'loading' || wallet?.status === 'loaded') {
            return;
        }

        dispatch(
            loadSparkWalletThunk({
                accountNumber: selectedAccount.accountNumber,
                deviceStaticSessionId,
                walletDescriptor,
            }),
        );
    }, [
        deviceStaticSessionId,
        dispatch,
        isEnabled,
        selectedAccount,
        wallet?.status,
        walletDescriptor,
    ]);

    const goToSparkRoute = (nextRouteName: SparkRouteName) => {
        dispatch(goto({ routeName: nextRouteName }));
    };

    const addAccount = () => {
        if (!walletDescriptor) {
            return;
        }

        const nextAccountNumber =
            accounts.length > 0
                ? Math.max(...accounts.map(account => account.accountNumber)) + 1
                : 0;

        if (!deviceStaticSessionId) {
            return;
        }

        dispatch(
            addSparkAccountThunk({
                accountNumber: nextAccountNumber,
                deviceStaticSessionId,
                walletDescriptor,
            }),
        );
        dispatch(goto({ routeName: 'spark-index' }));
    };

    const selectAccount = (accountNumber: number) => {
        if (!walletDescriptor) {
            return;
        }

        dispatch(
            sparkActions.selectSparkAccount({
                accountNumber,
                walletDescriptor,
            }),
        );
        dispatch(goto({ routeName: currentSparkRouteName }));
    };

    const refreshLightningInvoice = () => {
        if (!walletDescriptor || !selectedAccount) {
            return;
        }

        if (!deviceStaticSessionId) {
            return;
        }

        dispatch(
            refreshSparkLightningInvoiceThunk({
                accountNumber: selectedAccount.accountNumber,
                deviceStaticSessionId,
                walletDescriptor,
            }),
        );
    };

    const reloadSelectedAccount = () => {
        if (!deviceStaticSessionId || !walletDescriptor || !selectedAccount) {
            return;
        }

        dispatch(
            loadSparkWalletThunk({
                accountNumber: selectedAccount.accountNumber,
                deviceStaticSessionId,
                walletDescriptor,
            }),
        );
    };

    const submitLightningSend = async (params: { amountSats?: string; invoice: string }) => {
        if (!deviceStaticSessionId || !walletDescriptor || !selectedAccount) {
            return false;
        }

        const result = await dispatch(
            submitSparkLightningSendThunk({
                accountNumber: selectedAccount.accountNumber,
                amountSats: params.amountSats,
                deviceStaticSessionId,
                invoice: params.invoice,
                walletDescriptor,
            }),
        );

        return !submitSparkLightningSendThunk.rejected.match(result);
    };

    return {
        accounts,
        addAccount,
        currentSparkRouteName,
        device,
        deviceStaticSessionId,
        goToSparkRoute,
        isEnabled,
        refreshLightningInvoice,
        reloadSelectedAccount,
        selectAccount,
        selectedAccount,
        selectedAccountNumber,
        submitLightningSend,
        wallet,
        walletDescriptor,
    };
};
