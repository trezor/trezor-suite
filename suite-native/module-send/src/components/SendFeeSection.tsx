import { useSelector } from 'react-redux';

import {
    type AccountsRootState,
    type SendRootState,
    selectAccountNetworkSymbol,
    selectSendFormDraftByKey,
} from '@suite-common/wallet-core';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { Box } from '@suite-native/atoms';
import { useFormContext, useFormState } from '@suite-native/forms';
import { updateSelectedFeeLevelThunk } from '@suite-native/send';
import { FeeSelector } from '@suite-native/transaction-management';

import { type SendOutputsFormValues } from '../sendOutputsFormSchema';

type SendFeeSectionProps = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
};

export const SendFeeSection = ({ accountKey, tokenContract }: SendFeeSectionProps) => {
    const networkSymbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );
    const formDraft = useSelector((state: SendRootState) =>
        selectSendFormDraftByKey(state, accountKey, tokenContract),
    );
    const { control } = useFormContext<SendOutputsFormValues>();
    const { isValid } = useFormState({ control });

    if (!isValid || !networkSymbol) return null;

    return (
        <Box marginTop="sp16">
            <FeeSelector
                accountKey={accountKey}
                tokenContract={tokenContract}
                updateThunk={updateSelectedFeeLevelThunk}
                selectedFee={formDraft?.selectedFee ?? 'normal'}
                selectedFeePerUnit={formDraft?.feePerUnit}
                selectedSetMaxOutputId={formDraft?.setMaxOutputId}
                formDraft={formDraft}
            />
        </Box>
    );
};
