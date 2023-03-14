import TrezorConnect, { UI, DeviceButtonRequest, PROTO } from '@trezor/connect';
import { GetState, Dispatch } from '@suite-types';
import { notificationsActions } from '@suite-common/toast-notifications';
import * as modalActions from '@suite-actions/modalActions';
import {
    COINMARKET_BUY,
    COINMARKET_EXCHANGE,
    COINMARKET_SAVINGS,
    COINMARKET_COMMON,
} from '../constants';
import { getUnusedAddressFromAccount } from '@wallet-utils/coinmarket/coinmarketUtils';
import { Account } from '@wallet-types';
import { ComposedTransactionInfo } from '@wallet-reducers/coinmarketReducer';
import * as suiteActions from '@suite-actions/suiteActions';
import { submitRequestForm as envSubmitRequestForm, isDesktop } from '@suite-utils/env';
import * as formDraftActions from '@wallet-actions/formDraftActions';
import {
    amountToSatoshi,
    formatAmount,
    getAccountDecimals,
    hasNetworkFeatures,
    parseFormDraftKey,
    cardanoUtils,
} from '@suite-common/wallet-utils';
import { Output } from '@suite-common/wallet-types/src';

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
        const { device } = getState().suite;
        if (!device || !account) return;
        const accountAddress = getUnusedAddressFromAccount(account);
        address = address ?? accountAddress.address;
        path = path ?? accountAddress.path;
        if (!path || !address) return;

        const { networkType, symbol } = account;
        const { useEmptyPassphrase, connected, available } = device;

        const modalPayload = {
            device,
            address,
            networkType,
            symbol,
            addressPath: path,
        };

        // Show warning when device is not connected
        if (!connected || !available) {
            dispatch(
                modalActions.openModal({
                    type: 'unverified-address',
                    ...modalPayload,
                }),
            );
            return;
        }

        const params = {
            device,
            path,
            useEmptyPassphrase,
            coin: account.symbol,
        };

        // catch button request and open modal
        const buttonRequestHandler = (event: DeviceButtonRequest['payload']) => {
            if (!event || event.code !== 'ButtonRequest_Address') return;
            dispatch(
                modalActions.openModal({
                    type: 'address',
                    ...modalPayload,
                }),
            );
        };

        TrezorConnect.on(UI.REQUEST_BUTTON, buttonRequestHandler);

        let response;
        switch (account.networkType) {
            case 'ethereum':
                response = await TrezorConnect.ethereumGetAddress(params);
                break;
            case 'cardano':
                response = await TrezorConnect.cardanoGetAddress({
                    device,
                    useEmptyPassphrase: device.useEmptyPassphrase,
                    addressParameters: {
                        stakingPath: cardanoUtils.getStakingPath(account),
                        addressType: cardanoUtils.getAddressType(account.accountType),
                        path,
                    },
                    protocolMagic: cardanoUtils.getProtocolMagic(account.symbol),
                    networkId: cardanoUtils.getNetworkId(account.symbol),
                    derivationType: cardanoUtils.getDerivationType(account.accountType),
                });
                break;
            case 'ripple':
                response = await TrezorConnect.rippleGetAddress(params);
                break;
            case 'bitcoin':
                response = await TrezorConnect.getAddress(params);
                break;
            default:
                response = {
                    success: false,
                    payload: { error: 'Method for getAddress not defined', code: undefined },
                };
                break;
        }

        TrezorConnect.off(UI.REQUEST_BUTTON, buttonRequestHandler);

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
        const { device } = getState().suite;
        if (device && !device.remember && !isDesktop()) {
            dispatch(suiteActions.toggleRememberDevice(device, true));
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
