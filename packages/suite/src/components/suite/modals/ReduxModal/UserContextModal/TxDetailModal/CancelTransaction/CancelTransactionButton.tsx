import { DEFAULT_PAYMENT } from '@suite-common/wallet-constants';
import { Account, FormState } from '@suite-common/wallet-types';
import { NewModal } from '@trezor/components';

import { Translation } from 'src/components/suite';
import { useDevice, useDispatch } from 'src/hooks/suite';

import { signAndPushSendFormTransactionThunk } from '../../../../../../../actions/wallet/send/sendFormThunks';
import { useCancelTxContext } from '../../../../../../../hooks/wallet/useCancelTxContext';

type CancelTransactionButtonProps = {
    account: Account;
};

export const CancelTransactionButton = ({ account }: CancelTransactionButtonProps) => {
    const { device, isLocked } = useDevice();

    const dispatch = useDispatch();
    const { composedCancelTx } = useCancelTxContext();

    const handleCancelTx = () => {
        if (composedCancelTx === null) {
            return;
        }

        const formState: FormState = {
            feeLimit: '', // Eth only
            feePerUnit: composedCancelTx.feePerByte,
            hasCoinControlBeenOpened: false,
            isCoinControlEnabled: false,
            options: ['broadcast'],

            outputs: composedCancelTx.outputs.map(output => ({
                ...DEFAULT_PAYMENT,
                ...output,
                amount: output.amount.toString(),
            })),

            selectedUtxos: [],
        };

        return dispatch(
            signAndPushSendFormTransactionThunk({
                formState,
                precomposedTransaction: composedCancelTx,
                selectedAccount: account,
            }),
        ).unwrap();
    };

    const isDisabled = isLocked() || !device || !device?.available || composedCancelTx === null;

    return (
        <NewModal.Button
            data-testid="@send/cancel-tx-button"
            isDisabled={isDisabled}
            onClick={handleCancelTx}
            variant="destructive"
        >
            <Translation id="TR_CANCEL_TX_BUTTON" />
        </NewModal.Button>
    );
};
