import { type ReactNode } from 'react';

import { Card, Divider, Row, Text } from '@trezor/components';

export type EarnInfoCardRow = {
    key: string;
    label: ReactNode;
    value: ReactNode;
    isHidden?: boolean;
};

type EarnInfoCardProps = {
    rows: EarnInfoCardRow[];
};

export const EarnInfoCard = ({ rows }: EarnInfoCardProps) => {
    const visibleRows = rows.filter(row => !row.isHidden);

    return (
        <Card paddingType="none">
            {visibleRows.map((row, index) => (
                <>
                    <Row
                        key={row.key}
                        alignItems="center"
                        justifyContent="space-between"
                        padding={{ horizontal: 20, vertical: 12 }}
                        height={56}
                    >
                        <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                            {row.label}
                        </Text>

                        <Text typographyStyle="body-sm">{row.value}</Text>
                    </Row>

                    {index < rows.length - 1 && <Divider margin={{ vertical: 0 }} />}
                </>
            ))}
        </Card>
    );
};
