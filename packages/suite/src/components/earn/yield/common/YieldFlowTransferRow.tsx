import { Translation, type TranslationId } from '@suite/intl';
import { type YieldFlowCompleteValue } from '@suite-common/wallet-core';
import { Column, Icon, Row, Text } from '@trezor/components';
import { ArrowDownIcon, ArrowRightIcon } from '@trezor/icons';

import { useLayoutSize } from 'src/hooks/suite/useLayoutSize';

import { YieldTokenValue } from './YieldTokenValue';

type YieldFlowTransferRowProps = {
    inputLabelId: TranslationId;
    outputLabelId: TranslationId;
    input: YieldFlowCompleteValue;
    output: YieldFlowCompleteValue;
    /** Present the input token as its native asset (set when the input is the wrapped-native deposit token, never the receipt token). */
    inputPresentsNative?: boolean;
    /** Present the output token as its native asset (set when the output is the wrapped-native deposit token, never the receipt token). */
    outputPresentsNative?: boolean;
};

export const YieldFlowTransferRow = ({
    inputLabelId,
    outputLabelId,
    input,
    output,
    inputPresentsNative = false,
    outputPresentsNative = false,
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
                presentWrappedAsNative={inputPresentsNative}
                data-testid="@yield/flow-complete/transfer/input"
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
                presentWrappedAsNative={outputPresentsNative}
                data-testid="@yield/flow-complete/transfer/output"
            />
        </Column>
    );

    if (isBelowTablet) {
        return (
            <Column
                gap={12}
                padding={{ vertical: 16, horizontal: 20 }}
                data-testid="@yield/flow-complete/transfer"
            >
                {inputColumn}
                <Icon as={ArrowDownIcon} size={20} intent="neutral" priority="secondary" />
                {outputColumn}
            </Column>
        );
    }

    return (
        <Row
            justifyContent="space-between"
            alignItems="center"
            padding={{ vertical: 16, horizontal: 20 }}
            data-testid="@yield/flow-complete/transfer"
        >
            {inputColumn}
            <Icon as={ArrowRightIcon} size={20} intent="neutral" priority="secondary" />
            {outputColumn}
        </Row>
    );
};
