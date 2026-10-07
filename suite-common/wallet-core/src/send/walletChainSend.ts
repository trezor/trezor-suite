import { type TrezorDevice } from '@suite-common/suite-types';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    type Account,
    AddressDisplayOptions,
    type ComposeActionContext,
    type GeneralPrecomposedLevels,
} from '@suite-common/wallet-types';
import { type PROTO } from '@trezor/connect';
import {
    type ChainComposeContext,
    type ChainSendError,
    type ChainSignOptions,
} from '@trezor/network-module-suite-common-types';

import { toChainSendDevice } from './chainSendAdapter';
import {
    type WalletSettingsRootState,
    selectAddressDisplayType,
    selectAreSatsAmountUnit,
    selectBitcoinAmountUnit,
    selectIsNetworkReserveEnabled,
} from '../settings/walletSettingsReducer';
import { type TransactionsRootState } from '../transactions/transactionsReducerTypes';
import { selectTransactions } from '../transactions/transactionsSelectors';

type NotifyDispatch = (action: ReturnType<typeof notificationsActions.addToast>) => unknown;

/** What a chain network composes with: the form's context and the user's settings. */
export const selectWalletChainComposeContext = (
    state: WalletSettingsRootState,
    { account, network: _network, ...composeContext }: ComposeActionContext,
): ChainComposeContext => ({
    ...composeContext,
    ...(account.networkType === 'ethereum' || account.networkType === 'solana'
        ? { isNetworkReserveEnabled: selectIsNetworkReserveEnabled(state) }
        : {}),
    ...(account.networkType === 'bitcoin'
        ? { isSmallestUnitEnabled: selectAreSatsAmountUnit(state) }
        : {}),
});

/** Composed levels that failed for a reason the form cannot show are reported as a toast. */
export const notifyChainComposeLevels = (
    dispatch: NotifyDispatch,
    account: Pick<Account, 'networkType'>,
    levels: GeneralPrecomposedLevels,
) => {
    if (account.networkType !== 'bitcoin' && account.networkType !== 'cardano') return;

    Object.values(levels).forEach(tx => {
        if (tx?.type === 'error' && !tx.errorMessage) {
            dispatch(
                notificationsActions.addToast({
                    type: 'sign-tx-error',
                    // A bitcoin coin selection error ('COINSELECT') carries its details as a message.
                    error:
                        account.networkType === 'bitcoin' && 'message' in tx
                            ? tx.message
                            : tx.error,
                }),
            );
        }
    });
};

/** A compose that failed outright is reported as a toast where the family reported it so. */
export const notifyChainComposeFailure = (
    dispatch: NotifyDispatch,
    account: Pick<Account, 'networkType'>,
    error: ChainSendError,
) => {
    if (account.networkType === 'bitcoin' || account.networkType === 'cardano') {
        const isConnectFailure = error.connectErrorCode !== undefined;
        if (isConnectFailure && error.connectErrorCode !== 'Method_InvalidParameter') {
            dispatch(
                notificationsActions.addToast({ type: 'sign-tx-error', error: error.message }),
            );
        }
    }

    if (account.networkType === 'tron' && error.code === 'fee-estimation-failed') {
        dispatch(notificationsActions.addToast({ type: 'estimated-fee-error' }));
    }
};

export type SelectWalletChainSignOptionsParams = {
    account: Account;
    device: TrezorDevice;
    paymentRequests?: PROTO.PaymentRequest[];
};

/** How the device signs: where, how addresses are shown, and what the user's settings say. */
export const selectWalletChainSignOptions = (
    state: WalletSettingsRootState & TransactionsRootState,
    { account, device, paymentRequests }: SelectWalletChainSignOptionsParams,
): ChainSignOptions => ({
    device: toChainSendDevice(device),
    chunkify: selectAddressDisplayType(state) === AddressDisplayOptions.CHUNKED,
    paymentRequests,
    ...(account.networkType === 'bitcoin'
        ? {
              amountUnit: selectBitcoinAmountUnit(state),
              replacedTransactions: selectTransactions(state)[account.key] || [],
          }
        : {}),
});
