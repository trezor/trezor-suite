import { createThunk } from '@suite-common/redux-utils';
import { selectIsSuiteSyncEnabled } from '@suite-common/suite-sync';
import {
    createSimpleTargetId,
    selectPrecomposedSendForm,
    selectSendPrecomposedTx,
} from '@suite-common/wallet-core';
import { Account, TxTargetId } from '@suite-common/wallet-types';
import { isCardanoTx } from '@suite-common/wallet-utils';
import { featureUsed } from '@suite-native/experimental-features';

const TRANSACTION_MANAGEMENT_PREFIX = '@suite-native/transaction-management';

type AddTransactionLabelingThunkParams = {
    selectedAccount: Account;
    txId: string;
};

// Todo: This code below is kinda copy-paste from `applySendFormMetadataLabelsThunk` in Desktop.
//       However, desktop code is polluted by Legacy Labeling (Metadata) so it cannot be easily reused.
//       After we get rid of old Labeling, this shall be unified and move to the wallet-core.
export const addTransactionLabelingThunk = createThunk<
    void,
    AddTransactionLabelingThunkParams,
    void
>(
    `${TRANSACTION_MANAGEMENT_PREFIX}/sendTransactionThunk`,
    ({ selectedAccount, txId }, { dispatch, getState, extra }) => {
        const isSuiteSyncEnabled = selectIsSuiteSyncEnabled(getState());

        if (!isSuiteSyncEnabled) {
            return;
        }

        const precomposedTransaction = selectSendPrecomposedTx(getState());

        if (precomposedTransaction) {
            const precomposedForm = selectPrecomposedSendForm(getState());

            const outputsPermutation = isCardanoTx(selectedAccount, precomposedTransaction)
                ? precomposedTransaction?.outputs.map((_o, i) => i) // cardano preserves order of outputs
                : precomposedTransaction?.outputsPermutation;

            const transactionUtxoLabels = (precomposedForm?.outputs ?? []).reduce<
                {
                    txTargetId: TxTargetId;
                    value: string;
                }[]
            >((acc, formOutput, index) => {
                const { label } = formOutput;

                if (label) {
                    // final ordering of outputs differs from order in send form
                    // outputsPermutation contains mapping from @trezor/utxo-lib outputs to send form outputs
                    // mapping goes like this: Array<@trezor/utxo-lib index : send form index>
                    const outputIndex = outputsPermutation.findIndex(p => p === index);

                    acc.push({
                        // Todo: this works only for bitcoin-like networks where txTargetId is the outputIndex (number)
                        txTargetId: createSimpleTargetId({ n: outputIndex }),
                        value: label,
                    });
                }

                return acc;
            }, []);

            dispatch(featureUsed('suite-sync'));

            for (const label of transactionUtxoLabels) {
                extra.services.suiteSync.labeling.updateOutputLabel({
                    deviceStaticSessionId: selectedAccount.deviceState,
                    txId,
                    txTargetId: label.txTargetId,
                    label: label.value,
                    accountDescriptor: selectedAccount.descriptor,
                    networkSymbol: selectedAccount.symbol,
                });
            }
        }
    },
);
