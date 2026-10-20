import { type YieldFlowCompleteValue } from '@suite-common/wallet-core';
import { Translation } from '@suite-lego/intl';

import { YieldFlowComplete } from './YieldFlowComplete';
import { YieldFlowTransferRow } from './YieldFlowTransferRow';

type YieldFlowCompleteWithdrawProps = {
    input: YieldFlowCompleteValue;
    output: YieldFlowCompleteValue;
    vaultId: string;
};

export const YieldFlowCompleteWithdraw = ({
    input,
    output,
    vaultId,
}: YieldFlowCompleteWithdrawProps) => (
    <YieldFlowComplete
        type="withdraw"
        heading={<Translation id="TR_EARN_YIELD_WITHDRAW_COMPLETE" />}
        description={
            <Translation
                id="TR_EARN_YIELD_WITHDRAW_COMPLETE_DESCRIPTION"
                values={{ displaySymbol: output.token.symbol }}
            />
        }
        vaultId={vaultId}
        showFeedback
    >
        <YieldFlowTransferRow
            inputLabelId="TR_EARN_YIELD_WITHDRAWN"
            outputLabelId="TR_RECEIVED"
            input={input}
            output={output}
        />
    </YieldFlowComplete>
);
