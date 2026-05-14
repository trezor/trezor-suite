import { type ReactNode } from 'react';

import { Column, Link, Paragraph, Row, Spinner } from '@trezor/components';

export type PendingTransactionInfoProps = {
    title: ReactNode;
    txidLabel: ReactNode;
    txidComponent: ReactNode;
    onTxClick?: () => void;
};

export const PendingTransactionInfo = ({
    title,
    txidLabel,
    txidComponent,
    onTxClick,
}: PendingTransactionInfoProps) => (
    <Column width="100%" alignItems="flex-start">
        <Row alignItems="flex-start" gap={12}>
            <Spinner size={20} margin={{ top: 4 }} />

            <Column>
                <Paragraph
                    typographyStyle="body-md"
                    intent="neutral"
                    priority="secondary"
                    align="start"
                >
                    {title}
                </Paragraph>

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
