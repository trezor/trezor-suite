import { formDraftActions, selectDeepCopyOfFormDraft } from '@suite-common/wallet-core';
import type { Output } from '@suite-common/wallet-types';
import {
    convertAmountSubunitsToUnits,
    convertAmountUnitsToSubunits,
    getAccountDecimals,
    hasNetworkFeatures,
    parseFormDraftKey,
} from '@suite-common/wallet-utils';
import { PROTO } from '@trezor/connect';

import { type Dispatch, type GetState } from 'src/types/suite';
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
    () => {
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
        const [_prefix, accountKey] = parseFormDraftKey(formDraftKey);
        const relatedAccount = accounts.find(({ key }) => key === accountKey);

        if (!relatedAccount || !hasNetworkFeatures(relatedAccount, 'amount-unit')) {
            return;
        }

        const draft = selectDeepCopyOfFormDraft(getState(), formDraftKey) as FormState | undefined;

        if (draft) {
            const areSatsSelected = settings.bitcoinAmountUnit === PROTO.AmountUnit.SATOSHI;
            const conversion = areSatsSelected
                ? convertAmountUnitsToSubunits
                : convertAmountSubunitsToUnits;
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

            dispatch(
                formDraftActions.storeDraft({
                    key: formDraftKey,
                    formDraft: draft,
                }),
            );
        }
    });
};
