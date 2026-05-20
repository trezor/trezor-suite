import { Translation, type TranslationId } from '@suite/intl';
import { type YieldFlowCompleteValue } from '@suite-common/wallet-core';
import { Column, Icon, Row, Text } from '@trezor/components';

import { useLayoutSize } from 'src/hooks/suite/useLayoutSize';

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
}: YieldFlowTransferRowProps) => {
    const { isBelowTablet } = useLayoutSize();

    const inputColumn = (
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
    );

    const outputColumn = (
        <Column gap={8} alignItems={isBelowTablet ? 'flex-start' : 'flex-end'}>
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
    );

    if (isBelowTablet) {
        return (
            <Column gap={12} padding={{ vertical: 16, horizontal: 20 }}>
                {inputColumn}
                <Icon name="arrowDown" size={20} intent="neutral" priority="secondary" />
                {outputColumn}
            </Column>
        );
    }

    return (
        <Row
            justifyContent="space-between"
            alignItems="center"
            padding={{ vertical: 16, horizontal: 20 }}
        >
            {inputColumn}
            <Icon name="arrowRight" size={20} intent="neutral" priority="secondary" />
            {outputColumn}
        </Row>
    );
};
