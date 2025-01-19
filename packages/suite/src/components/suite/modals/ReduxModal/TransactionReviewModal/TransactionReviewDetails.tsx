import styled from 'styled-components';

import { Card, Column, Text, InfoItem } from '@trezor/components';
import { GeneralPrecomposedTransactionFinal } from '@suite-common/wallet-types';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';

const Pre = styled.pre`
    text-align: left;
    word-break: break-all;
    white-space: pre-wrap;
    font-family: monospace;
`;

export interface TransactionReviewDetailsProps {
    tx: GeneralPrecomposedTransactionFinal;
    txHash?: string;
}

const prettify = (json: Record<any, any>) => JSON.stringify(json, null, 2);

export const TransactionReviewDetails = ({ tx, txHash }: TransactionReviewDetailsProps) => {
    if (tx.inputs.length === 0) return null; // BTC-only, TODO: eth/ripple

    return (
        <Card>
            <Column gap={spacings.lg}>
                <InfoItem label={<Translation id="TR_SIZE" />}>
                    <Text typographyStyle="hint">
                        {tx.bytes} <Translation id="TR_BYTES" />
                    </Text>
                </InfoItem>
                <InfoItem label={<Translation id="TR_INPUTS" />}>
                    <Card paddingType="small">
                        <Text typographyStyle="label" as="div">
                            <Pre>{prettify(tx.inputs)}</Pre>
                        </Text>
                    </Card>
                </InfoItem>
                <InfoItem label={<Translation id="TR_OUTPUTS" />}>
                    <Card paddingType="small">
                        <Text typographyStyle="label" as="div">
                            <Pre>{prettify(tx.outputs)}</Pre>
                        </Text>
                    </Card>
                </InfoItem>
                {txHash && (
                    <InfoItem label={<Translation id="RAW_TRANSACTION" />}>
                        <Card paddingType="small">
                            <Text typographyStyle="label" as="div">
                                <Pre>{txHash}</Pre>
                            </Text>
                        </Card>
                    </InfoItem>
                )}
            </Column>
        </Card>
    );
};
