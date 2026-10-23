import { CommonActions } from '@react-navigation/native';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountKey, type FormState, type TokenAddress } from '@suite-common/wallet-types';
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

export type SendFlowExitDestination =
    { type: 'assetDetail'; networkSymbol: NetworkSymbol } | { type: 'accountDetail' };

type GetSendFlowExitDestinationParams = {
    isAssetsFirstEnabled: boolean;
    networkSymbol: NetworkSymbol | null | undefined;
};

/**
 * The assets-first experiment exits the send flow to the asset detail, every other case exits to
 * the account detail. Without a resolved network symbol there is no asset detail to open.
 */
export const getSendFlowExitDestination = ({
    isAssetsFirstEnabled,
    networkSymbol,
}: GetSendFlowExitDestinationParams): SendFlowExitDestination =>
    isAssetsFirstEnabled && networkSymbol
        ? { type: 'assetDetail', networkSymbol }
        : { type: 'accountDetail' };

type NavigateOutOfSendFlowActionParams = {
    accountKey: AccountKey;
    destination: SendFlowExitDestination;
    tokenContract?: TokenAddress;
    txid?: string;
};

export const navigateOutOfSendFlowAction = ({
    accountKey,
    destination,
    tokenContract,
    txid,
}: NavigateOutOfSendFlowActionParams) => {
    const detailRoute =
        destination.type === 'assetDetail'
            ? {
                  name: RootStackRoutes.AssetsStack,
                  params: {
                      screen: AssetsStackRoutes.AssetDetail,
                      params: {
                          networkSymbol: destination.networkSymbol,
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
              };

    const routes: any[] = [
        {
            name: RootStackRoutes.AppTabs,
            params: {
                screen: AppTabsRoutes.HomeStack,
            },
        },
        detailRoute,
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
