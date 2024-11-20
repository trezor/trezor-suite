import { NewModal } from '@trezor/components';
import { SelectedAccountLoaded, RbfTransactionParams } from '@suite-common/wallet-types';

import { Translation } from 'src/components/suite';
import { useDevice } from 'src/hooks/suite';
import { useRbf } from 'src/hooks/wallet/useRbfForm';

type ReplaceTxButtonProps = {
    rbfParams: RbfTransactionParams;
    selectedAccount: SelectedAccountLoaded;
};

export const ReplaceTxButton = ({ rbfParams, selectedAccount }: ReplaceTxButtonProps) => {
    const { device, isLocked } = useDevice();
    const { isLoading, signTransaction, getValues, composedLevels } = useRbf({
        selectedAccount,
        rbfParams,
    });

    const values = getValues();
    const composedTx = composedLevels ? composedLevels[values.selectedFee || 'normal'] : undefined;
    const isDisabled =
        !composedTx || composedTx.type !== 'final' || isLocked() || (device && !device.available);

    return (
        <NewModal.Button
            data-testid="@send/replace-tx-button"
            isDisabled={isDisabled || isLoading}
            onClick={signTransaction}
        >
            <Translation id="TR_REPLACE_TX" />
        </NewModal.Button>
    );
};
