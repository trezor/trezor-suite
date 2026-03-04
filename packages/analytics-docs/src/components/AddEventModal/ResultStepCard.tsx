import type { ReactNode } from 'react';

import { Card, Column, Row, Text } from '@trezor/components';

import { CopyButton } from './CopyButton';

type ResultStepCardProps = {
    title: string;
    description?: ReactNode;
    copyText: string;
    copyLabel: string;
    codeContent: ReactNode;
    codeStyle?: React.CSSProperties;
};

export const ResultStepCard = ({
    title,
    description,
    copyText,
    copyLabel,
    codeContent,
    codeStyle,
}: ResultStepCardProps) => (
    <Card paddingType="normal">
        <Column gap={8}>
            <Text typographyStyle="body-md">{title}</Text>
            {description && <Text typographyStyle="body-sm">{description}</Text>}
            <Row justifyContent="flex-end">
                <CopyButton textToCopy={copyText} copyLabel={copyLabel} />
            </Row>
            <Card paddingType="normal">
                <div
                    style={{
                        fontFamily: 'monospace',
                        fontSize: 13,
                        overflow: 'auto',
                        whiteSpace: 'pre',
                        ...codeStyle,
                    }}
                >
                    {codeContent}
                </div>
            </Card>
        </Column>
    </Card>
);
