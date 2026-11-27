import { type ReactNode } from 'react';

import { Column, Table, Text } from '@trezor/components';

type AccountAssetMessageRowProps = {
    title: ReactNode;
    description?: ReactNode;
    'data-testid': string;
};

/** A row that says why the table lists nothing; its header and menu stay above it. */
export const AccountAssetMessageRow = ({
    title,
    description,
    'data-testid': dataTestId,
}: AccountAssetMessageRowProps) => (
    <Table.Row isHighlightedOnHover={false} data-testid={dataTestId}>
        <Table.Cell colSpan={3} align="center" maxWidth="100%" padding={{ vertical: 24 }}>
            <Column alignItems="center" gap={4}>
                <Text typographyStyle="body-md-strong">{title}</Text>
                {description !== undefined && (
                    <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                        {description}
                    </Text>
                )}
            </Column>
        </Table.Cell>
    </Table.Row>
);
