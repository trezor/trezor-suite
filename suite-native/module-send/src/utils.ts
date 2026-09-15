import { CommonActions } from '@react-navigation/native';

import { type AccountKey, type FormState, type TokenAddress } from '@suite-common/wallet-types';
import {
    AppTabsRoutes,
    RootStackRoutes,
    TransactionDetailStackRoutes,
} from '@suite-native/navigation';
import { type Utxo } from '@trezor/blockchain-link-types';
import { type FeeLevel } from '@trezor/connect';

import { type SendOutputFieldName, type SendOutputsFormValues } from './sendOutputsFormSchema';

export const getOutputFieldName = <TField extends SendOutputFieldName>(
    index: number,
    field: TField,
): `outputs.${number}.${TField}` => `outputs.${index}.${field}`;

export const constructFormDraft = ({
    formValues: { outputs, transactionData, ...restFormValues },
    tokenContract,
    feeLevel = { label: 'normal', feePerUnit: '' },
    selectedUtxos = [],
}: {
    formValues: SendOutputsFormValues;
    tokenContract?: TokenAddress;
    feeLevel?: Pick<FeeLevel, 'label' | 'feePerUnit' | 'feeLimit'>;
    selectedUtxos?: Utxo[];
}): FormState => ({
    outputs: outputs.map(({ address, resolvedAddress, amount, label, fiat = '' }) => ({
        address,
        // An empty string is the form's "name did not resolve" marker, never an address.
        resolvedAddress: resolvedAddress || undefined,
        amount,
        label,
        type: 'payment',
        token: tokenContract ?? null,
        fiat,
        currency: { label: '', value: '' },
    })),
    isCoinControlEnabled: selectedUtxos.length > 0,
    hasCoinControlBeenOpened: false,
    selectedUtxos,
    options: [],
    selectedFee: feeLevel.label,
    feePerUnit: feeLevel.feePerUnit,
    feeLimit: feeLevel.feeLimit ?? '',
    transactionData: transactionData || undefined,
    ...restFormValues,
});

export const isSameUtxo = (utxo1: Utxo, utxo2: Utxo): boolean =>
    utxo1.txid === utxo2.txid && utxo1.vout === utxo2.vout;

interface NavigateOutOfSendFlowActionProps {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
    txid?: string;
}

export const navigateOutOfSendFlowAction = ({
    accountKey,
    tokenContract,
    txid,
}: NavigateOutOfSendFlowActionProps) => {
    const routes: any[] = [
        {
            name: RootStackRoutes.AppTabs,
            params: {
                screen: AppTabsRoutes.HomeStack,
            },
        },
        {
            name: RootStackRoutes.AccountDetail,
            params: {
                accountKey,
                tokenContract,
            },
        },
    ];

    if (txid) {
        routes.push({
            name: RootStackRoutes.TransactionDetailStack,
            params: {
                screen: TransactionDetailStackRoutes.TransactionDetail,
                params: {
                    accountKey,
                    tokenContract,
                    txid,
                    closeActionType: 'close',
                    source: 'send',
                },
            },
        });
    }

    // Reset navigation stack to the transaction detail screen with HomeStack as a previous step, so the user can navigate back there.
    return CommonActions.reset({
        index: 1,
        routes,
    });
};
