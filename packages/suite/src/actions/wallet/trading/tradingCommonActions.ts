import { selectSelectedDevice, toggleRememberDevice } from '@suite-common/wallet-core';
import { Output } from '@suite-common/wallet-types/src';
import {
    amountToSmallestUnit,
    formatAmount,
    getAccountDecimals,
    hasNetworkFeatures,
    parseFormDraftKey,
} from '@suite-common/wallet-utils';
import { PROTO } from '@trezor/connect';
import { isDesktop } from '@trezor/env-utils';

import * as formDraftActions from 'src/actions/wallet/formDraftActions';
import { Dispatch, GetState } from 'src/types/suite';
import { submitRequestForm as envSubmitRequestForm } from 'src/utils/suite/env';

type FormState = {
    cryptoInput?: string;
    outputs?: Output[];
};

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
