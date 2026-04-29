import { Translation, type TranslationId } from '@suite/intl';
import { type YieldFlowCompleteValue } from '@suite-common/wallet-core';
import { Column, Icon, Row, Text } from '@trezor/components';

import { YieldTokenValue } from './YieldTokenValue';

type YieldFlowTransferRowProps = {
    inputLabelId: TranslationId;
    outputLabelId: TranslationId;
    input: YieldFlowCompleteValue;
    output: YieldFlowCompleteValue;
};

export const YieldFlowTransferRow = ({
    inputLabelId,
    outputLabelId,
    input,
    output,
}: YieldFlowTransferRowProps) => (
    <Row
        justifyContent="space-between"
        alignItems="center"
        padding={{ vertical: 16, horizontal: 20 }}
    >
        <Column gap={8}>
            <Text typographyStyle="body-md">
                <Translation id={inputLabelId} />
            </Text>
            <YieldTokenValue
                token={{
                    ...input.token,
                    contractAddress: input.token.contractAddress ?? null,
                }}
                amount={input.amount}
            />
        </Column>
        <Icon name="arrowRight" size={20} intent="neutral" priority="secondary" />
        <Column gap={8} alignItems="flex-end">
            <Text typographyStyle="body-md">
                <Translation id={outputLabelId} />
            </Text>
            <YieldTokenValue
                token={{
                    ...output.token,
                    contractAddress: output.token.contractAddress ?? null,
                }}
                amount={output.amount}
            />
        </Column>
    </Row>
);
