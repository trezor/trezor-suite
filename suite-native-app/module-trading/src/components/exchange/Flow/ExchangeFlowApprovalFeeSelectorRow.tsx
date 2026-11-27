import { useFormDraft } from '@suite-common/wallet-core';
import { type AccountKey, type FormState } from '@suite-common/wallet-types';
import { FeeSelectorRow } from '@suite-native/transaction-management';

import { updateTradingSelectedFeeLevelThunk } from '../../../thunks';

export type ExchangeFlowApprovalFeeSelectorRowProps = {
    accountKey: AccountKey;
};

export const ExchangeFlowApprovalFeeSelectorRow = ({
    accountKey,
}: ExchangeFlowApprovalFeeSelectorRowProps) => {
    const { draft: formDraft, formDraftKey } = useFormDraft<FormState>('trading-exchange');

    return (
        <FeeSelectorRow
            accountKey={accountKey}
            updateThunk={updateTradingSelectedFeeLevelThunk}
            selectedFee={formDraft?.selectedFee ?? 'normal'}
            selectedFeePerUnit={formDraft?.feePerUnit}
            formDraft={formDraft}
            formDraftKey={formDraftKey}
            baseValueOnly
        />
    );
};
