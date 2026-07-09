import { type ReactNode } from 'react';

import { Column, Link, Paragraph, Row, Spinner } from '@trezor/components';

import { PendingTransactionTimeEstimate } from './PendingTransactionTimeEstimate';

export type PendingTransactionInfoProps = {
    title: ReactNode;
    txidLabel: ReactNode;
    txidComponent: ReactNode;
    timeEstimateSeconds?: number;
    onTxClick?: () => void;
};

export const PendingTransactionInfo = ({
    title,
    txidLabel,
    txidComponent,
    timeEstimateSeconds,
    onTxClick,
}: PendingTransactionInfoProps) => (
    <Column width="100%" alignItems="flex-start">
        <Row width="100%" alignItems="flex-start" gap={12}>
            <Spinner size={20} margin={{ top: 4 }} />

            <Column flex="1">
                <Row width="100%" justifyContent="space-between" alignItems="center" gap={8}>
                    <Paragraph
                        typographyStyle="body-md"
                        intent="neutral"
                        priority="secondary"
                        align="start"
                    >
                        {title}
                    </Paragraph>

                    {timeEstimateSeconds !== undefined && (
                        <PendingTransactionTimeEstimate seconds={timeEstimateSeconds} />
                    )}
                </Row>

                <Row gap={4} flexWrap="wrap" alignItems="center">
                    <Paragraph
                        typographyStyle="body-md"
                        intent="neutral"
                        priority="secondary"
                        align="start"
                    >
                        {txidLabel}
                    </Paragraph>

                    {onTxClick ? <Link onClick={onTxClick}>{txidComponent}</Link> : txidComponent}
                </Row>
            </Column>
        </Row>
    </Column>
);
