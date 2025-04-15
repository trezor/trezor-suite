import { CryptoId } from 'invity-api';

import { type TradingType } from '@suite-common/trading';
import { selectSelectedDevice, toggleRememberDevice } from '@suite-common/wallet-core';
import { AccountKey, Output } from '@suite-common/wallet-types/src';
import {
    amountToSmallestUnit,
    formatAmount,
    getAccountDecimals,
    hasNetworkFeatures,
    parseFormDraftKey,
} from '@suite-common/wallet-utils';
import { PROTO } from '@trezor/connect';
import { isDesktop } from '@trezor/env-utils';

import { TRADING_COMMON } from 'src/actions/wallet/constants';
import * as formDraftActions from 'src/actions/wallet/formDraftActions';
import { ComposedTransactionInfo } from 'src/reducers/wallet/tradingReducer';
import { Dispatch, GetState } from 'src/types/suite';
import { submitRequestForm as envSubmitRequestForm } from 'src/utils/suite/env';

export type TradingCommonAction =
    | {
          type: typeof TRADING_COMMON.SAVE_COMPOSED_TRANSACTION_INFO;
          info: ComposedTransactionInfo;
      }
    | {
          type: typeof TRADING_COMMON.SET_LOADING;
          isLoading: boolean;
          lastLoadedTimestamp: number;
      }
    | {
          type: typeof TRADING_COMMON.LOAD_DATA;
      }
    | {
          type: typeof TRADING_COMMON.SET_MODAL_CRYPTO_CURRENCY;
          modalCryptoId: CryptoId | undefined;
      }
    | {
          type: typeof TRADING_COMMON.SET_MODAL_ACCOUNT_KEY;
          modalAccountKey: AccountKey | undefined;
      }
    | {
          type: typeof TRADING_COMMON.SET_TRADING_ACTIVE_SECTION;
          activeSection: TradingType;
      }
    | {
          type: typeof TRADING_COMMON.SET_TRADING_FROM_PREFILLED_CRYPTO_ID;
          prefilledFromCryptoId: CryptoId | undefined;
      };

type FormState = {
    cryptoInput?: string;
    outputs?: Output[];
};

/**
 * Set modalAccountKey to retrieve the correct account key in modals.
 * Used in ConfirmAddressModal and TransactionReviewModalContent through selectAccountKeyIncludingChosenInTrading.
 * Unset in middleware after modal is closed.
 */
export const setTradingModalAccountKey = (
    modalAccountKey: AccountKey | undefined,
): TradingCommonAction => ({
    type: TRADING_COMMON.SET_MODAL_ACCOUNT_KEY,
    modalAccountKey,
});

export const setActiveSection = (activeSection: TradingType): TradingCommonAction => ({
    type: TRADING_COMMON.SET_TRADING_ACTIVE_SECTION,
    activeSection,
});

export const saveComposedTransactionInfo = (
    info: ComposedTransactionInfo,
): TradingCommonAction => ({
    type: TRADING_COMMON.SAVE_COMPOSED_TRANSACTION_INFO,
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
        const device = selectSelectedDevice(getState());
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

export const setLoading = (isLoading: boolean, lastLoadedTimestamp = 0): TradingCommonAction => ({
    type: TRADING_COMMON.SET_LOADING,
    isLoading,
    lastLoadedTimestamp,
});

export const loadInvityData = (): TradingCommonAction => ({
    type: TRADING_COMMON.LOAD_DATA,
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
            const conversion = areSatsSelected ? amountToSmallestUnit : formatAmount;
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

export const setTradingPrefilledFromCryptoId = (
    prefilledFromCryptoId: CryptoId | undefined,
): TradingCommonAction => ({
    type: TRADING_COMMON.SET_TRADING_FROM_PREFILLED_CRYPTO_ID,
    prefilledFromCryptoId,
});
