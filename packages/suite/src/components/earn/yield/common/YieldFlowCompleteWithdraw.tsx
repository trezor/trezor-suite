import { Translation } from '@suite/intl';
import { type YieldFlowCompleteValue } from '@suite-common/wallet-core';

import { YieldFlowComplete } from './YieldFlowComplete';
import { YieldFlowTransferRow } from './YieldFlowTransferRow';

type YieldFlowCompleteWithdrawProps = {
    input: YieldFlowCompleteValue;
    output: YieldFlowCompleteValue;
};

export const YieldFlowCompleteWithdraw = ({ input, output }: YieldFlowCompleteWithdrawProps) => (
    <YieldFlowComplete
        heading={<Translation id="TR_EARN_YIELD_WITHDRAW_COMPLETE" />}
        description={
            <Translation
                id="TR_EARN_YIELD_WITHDRAW_COMPLETE_DESCRIPTION"
                values={{ displaySymbol: output.token.symbol }}
            />
        }
        showFeedback
    >
        <YieldFlowTransferRow
            inputLabelId="TR_SENT"
            outputLabelId="TR_RECEIVED"
            input={input}
            output={output}
        />
    </YieldFlowComplete>
);
