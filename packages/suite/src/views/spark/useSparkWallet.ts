import { goto, selectRouteName } from '@suite/router';
import { selectSelectedDevice } from '@suite-common/device';
import {
    selectIsSparkEnabled,
    selectSelectedSparkAccount,
    selectSelectedSparkAccountNumber,
    selectSparkAccountsByWalletDescriptor,
    selectSparkWalletByAccountNumber,
    sparkActions,
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
    const walletDescriptor = device?.state?.staticSessionId
        ? parseDeviceStaticSessionId(device.state.staticSessionId).walletDescriptor
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

        dispatch(
            sparkActions.addSparkAccount({
                accountNumber: nextAccountNumber,
                walletDescriptor,
            }),
        );
        dispatch(
            sparkActions.selectSparkAccount({
                accountNumber: nextAccountNumber,
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

        dispatch(
            sparkActions.refreshSparkLightningInvoice({
                accountNumber: selectedAccount.accountNumber,
                walletDescriptor,
            }),
        );
    };

    const submitLightningSend = (params: { amountSats: string; invoice: string }) => {
        if (!walletDescriptor || !selectedAccount) {
            return;
        }

        dispatch(
            sparkActions.submitSparkLightningSend({
                accountNumber: selectedAccount.accountNumber,
                amountSats: params.amountSats,
                invoice: params.invoice,
                walletDescriptor,
            }),
        );
    };

    return {
        accounts,
        addAccount,
        currentSparkRouteName,
        device,
        goToSparkRoute,
        isEnabled,
        refreshLightningInvoice,
        selectAccount,
        selectedAccount,
        selectedAccountNumber,
        submitLightningSend,
        wallet,
        walletDescriptor,
    };
};
