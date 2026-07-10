import { Translation } from '@suite/intl';
import { type YieldFlowCompleteValue } from '@suite-common/wallet-core';
import { Column, Row, Text } from '@trezor/components';

import { YieldFlowComplete } from './YieldFlowComplete';
import { YieldFlowTransferRow } from './YieldFlowTransferRow';
import { YieldTokenValue } from './YieldTokenValue';

type YieldFlowCompleteWithdrawProps = {
    input: YieldFlowCompleteValue;
    output?: YieldFlowCompleteValue;
    vaultId: string;
};

export const YieldFlowCompleteWithdraw = ({
    input,
    output,
    vaultId,
}: YieldFlowCompleteWithdrawProps) => {
    const receivedValue = output ?? input;

    return (
        <YieldFlowComplete
            type="withdraw"
            heading={<Translation id="TR_EARN_YIELD_WITHDRAW_COMPLETE" />}
            description={
                <Translation
                    id="TR_EARN_YIELD_WITHDRAW_COMPLETE_DESCRIPTION"
                    values={{ displaySymbol: receivedValue.token.symbol }}
                />
            }
            vaultId={vaultId}
            showFeedback
        >
            {output ? (
                <YieldFlowTransferRow
                    inputLabelId="TR_EARN_YIELD_AMOUNT_TO_WITHDRAW"
                    outputLabelId="TR_RECEIVED"
                    input={input}
                    output={output}
                />
            ) : (
                <Row
                    justifyContent="space-between"
                    alignItems="center"
                    padding={{ vertical: 16, horizontal: 20 }}
                >
                    <Column gap={8}>
                        <Text typographyStyle="body-md">
                            <Translation id="TR_RECEIVED" />
                        </Text>
                        <YieldTokenValue
                            token={{
                                ...receivedValue.token,
                                contractAddress: receivedValue.token.contractAddress ?? null,
                            }}
                            amount={receivedValue.amount}
                        />
                    </Column>
                </Row>
            )}
        </YieldFlowComplete>
    );
};
