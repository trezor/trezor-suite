import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { type GeneralPrecomposedTransactionFinal } from '@suite-common/wallet-types';
import { Card, Column, InfoItem, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

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
    if (tx.inputs.length === 0) return null; // only for BTC-like and ADA (UTXO-based chains), TODO ETH and other account-based?

    return (
        <Card>
            <Column gap={spacings.lg}>
                <InfoItem label={<Translation id="TR_SIZE" />}>
                    <Text typographyStyle="body-sm">
                        {tx.bytes} <Translation id="TR_BYTES" />
                    </Text>
                </InfoItem>
                <InfoItem label={<Translation id="TR_INPUTS" />}>
                    <Card paddingType="small">
                        <Text typographyStyle="body-xs" as="div">
                            <Pre>{prettify(tx.inputs)}</Pre>
                        </Text>
                    </Card>
                </InfoItem>
                <InfoItem label={<Translation id="TR_OUTPUTS" />}>
                    <Card paddingType="small">
                        <Text typographyStyle="body-xs" as="div">
                            <Pre>{prettify(tx.outputs)}</Pre>
                        </Text>
                    </Card>
                </InfoItem>
                {txHash && (
                    <InfoItem label={<Translation id="RAW_TRANSACTION" />}>
                        <Card paddingType="small">
                            <Text typographyStyle="body-xs" as="div">
                                <Pre>{txHash}</Pre>
                            </Text>
                        </Card>
                    </InfoItem>
                )}
            </Column>
        </Card>
    );
};
