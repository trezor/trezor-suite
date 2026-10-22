import { CommonActions } from '@react-navigation/native';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type AccountKey,
    type FormOptions,
    type FormState,
    type TokenAddress,
} from '@suite-common/wallet-types';
import {
    AccountDetailStackRoutes,
    AppTabsRoutes,
    AssetsStackRoutes,
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

type GetSendMaxAmountParams = {
    isTokenFlow: boolean;
    tokenBalance?: string;
    normalFeeLevelMaxAmount?: string;
};

export const getSendMaxAmount = ({
    isTokenFlow,
    tokenBalance,
    normalFeeLevelMaxAmount,
}: GetSendMaxAmountParams): string | undefined =>
    isTokenFlow ? tokenBalance : normalFeeLevelMaxAmount;

const buildDraftOptions = ({
    destinationTag,
    transactionData,
}: Pick<SendOutputsFormValues, 'destinationTag' | 'transactionData'>): FormOptions[] => [
    'broadcast',
    ...(destinationTag ? (['destinationTag'] as const) : []),
    ...(transactionData ? (['transactionData'] as const) : []),
];

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
    txType: 'send',
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
    options: buildDraftOptions({ destinationTag: restFormValues.destinationTag, transactionData }),
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
    networkSymbol?: NetworkSymbol;
}

export const navigateOutOfSendFlowAction = ({
    accountKey,
    tokenContract,
    txid,
    networkSymbol,
}: NavigateOutOfSendFlowActionProps) => {
    const routes: any[] = [
        {
            name: RootStackRoutes.AppTabs,
            params: {
                screen: AppTabsRoutes.HomeStack,
            },
        },
        networkSymbol
            ? {
                  name: RootStackRoutes.AssetsStack,
                  params: {
                      screen: AssetsStackRoutes.AssetDetail,
                      params: {
                          networkSymbol,
                          tokenContract,
                      },
                  },
              }
            : {
                  name: RootStackRoutes.AccountDetailStack,
                  params: {
                      screen: AccountDetailStackRoutes.AccountDetail,
                      params: {
                          accountKey,
                          tokenContract,
                          closeActionType: 'back',
                      },
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

    // Keep the asset or account detail in Back history after a confirmed send.
    return CommonActions.reset({
        index: routes.length - 1,
        routes,
    });
};
