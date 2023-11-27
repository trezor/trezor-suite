import { isDesktop } from '@trezor/env-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { PROTO } from '@trezor/connect';
import {
    amountToSatoshi,
    formatAmount,
    getAccountDecimals,
    hasNetworkFeatures,
    parseFormDraftKey,
} from '@suite-common/wallet-utils';
import { Output } from '@suite-common/wallet-types/src';
import {
    confirmAddressOnDeviceThunk,
    selectDevice,
    toggleRememberDevice,
} from '@suite-common/wallet-core';

import { GetState, Dispatch } from 'src/types/suite';
import * as modalActions from 'src/actions/suite/modalActions';
import { getUnusedAddressFromAccount } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { Account } from 'src/types/wallet';
import { ComposedTransactionInfo } from 'src/reducers/wallet/coinmarketReducer';
import { submitRequestForm as envSubmitRequestForm } from 'src/utils/suite/env';
import * as formDraftActions from 'src/actions/wallet/formDraftActions';

import {
    COINMARKET_BUY,
    COINMARKET_EXCHANGE,
    COINMARKET_SAVINGS,
    COINMARKET_COMMON,
} from '../constants';

export type CoinmarketCommonAction =
    | {
          type: typeof COINMARKET_COMMON.SAVE_COMPOSED_TRANSACTION_INFO;
          info: ComposedTransactionInfo;
      }
    | {
          type: typeof COINMARKET_COMMON.SET_LOADING;
          isLoading: boolean;
          lastLoadedTimestamp: number;
      }
    | {
          type: typeof COINMARKET_COMMON.LOAD_DATA;
      };

type FormState = {
    cryptoInput?: string;
    outputs?: Output[];
};

export const verifyAddress =
    (
        account: Account,
        address: string | undefined,
        path: string | undefined,
        coinmarketAction:
            | typeof COINMARKET_EXCHANGE.VERIFY_ADDRESS
            | typeof COINMARKET_BUY.VERIFY_ADDRESS
            | typeof COINMARKET_SAVINGS.VERIFY_ADDRESS,
    ) =>
    async (dispatch: Dispatch, getState: GetState) => {
        const device = selectDevice(getState());
        if (!device || !account) return;
        const accountAddress = getUnusedAddressFromAccount(account);
        address = address ?? accountAddress.address;
        path = path ?? accountAddress.path;
        if (!path || !address) return;

        const { useEmptyPassphrase, connected, available } = device;

        // Show warning when device is not connected
        if (!connected || !available) {
            dispatch(
                modalActions.openModal({
                    type: 'unverified-address',
                    value: address,
                    addressPath: path,
                }),
            );
            return;
        }

        const params = {
            device,
            accountKey: account.key,
            addressPath: path,
            useEmptyPassphrase,
            coin: account.symbol,
        };

        const response = await dispatch(confirmAddressOnDeviceThunk(params)).unwrap();

        if (response.success) {
            dispatch({
                type: coinmarketAction,
                addressVerified: address,
            });
        } else {
            // special case: device no-backup permissions not granted
            if (response.payload.code === 'Method_PermissionsNotGranted') return;

            dispatch(
                notificationsActions.addToast({
                    type: 'verify-address-error',
                    error: response.payload.error,
                }),
            );
        }
    };

export const saveComposedTransactionInfo = (
    info: ComposedTransactionInfo,
): CoinmarketCommonAction => ({
    type: COINMARKET_COMMON.SAVE_COMPOSED_TRANSACTION_INFO,
    info,
});

export const submitRequestForm =
    (form?: {
        formMethod: 'GET' | 'POST' | 'IFRAME';
        formAction: string;
        formTarget?: '_blank' | '_self';
        fields: {
            [key: string]: string;
        };
    }) =>
    (dispatch: Dispatch, getState: GetState) => {
        const device = selectDevice(getState());
        if (device && !device.remember && !isDesktop()) {
            dispatch(toggleRememberDevice({ device, forceRemember: true }));
        }
        if (form) {
            envSubmitRequestForm(
                form.formMethod,
                form.formAction,
                form.formTarget || '_self',
                form.fields,
            );
        }
    };

export const setLoading = (
    isLoading: boolean,
    lastLoadedTimestamp = 0,
): CoinmarketCommonAction => ({
    type: COINMARKET_COMMON.SET_LOADING,
    isLoading,
    lastLoadedTimestamp,
});

export const loadInvityData = (): CoinmarketCommonAction => ({
    type: COINMARKET_COMMON.LOAD_DATA,
});

export const convertDrafts = () => (dispatch: Dispatch, getState: GetState) => {
    const { accounts, formDrafts, settings } = getState().wallet;
    const formDraftKeys = Object.keys(formDrafts);

    formDraftKeys.forEach(formDraftKey => {
        const [prefix, accountKey] = parseFormDraftKey(formDraftKey);
        const relatedAccount = accounts.find(({ key }) => key === accountKey);

        if (!relatedAccount || !hasNetworkFeatures(relatedAccount, 'amount-unit')) {
            return;
        }

        const getDraft = formDraftActions.getDraft<FormState>(prefix);
        const saveDraft = formDraftActions.saveDraft<FormState>(prefix);
        const draft = dispatch(getDraft(accountKey));

        if (draft) {
            const areSatsSelected = settings.bitcoinAmountUnit === PROTO.AmountUnit.SATOSHI;
            const conversion = areSatsSelected ? amountToSatoshi : formatAmount;
            const decimals = getAccountDecimals(relatedAccount.symbol)!;

            if (draft.cryptoInput) {
                draft.cryptoInput = conversion(draft.cryptoInput, decimals);
            }
            if (draft.outputs) {
                draft.outputs.forEach(output => {
                    if (output.amount) {
                        output.amount = conversion(output.amount, decimals);
                    }
                });
            }

            dispatch(saveDraft(accountKey, draft));
        }
    });
};
