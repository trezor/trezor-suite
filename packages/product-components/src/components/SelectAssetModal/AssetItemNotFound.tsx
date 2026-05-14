import { type ReactNode } from 'react';

import { Column, Paragraph, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

interface AssetItemNotFoundProps {
    noItemsAvailablePlaceholder: { heading: ReactNode; body?: ReactNode };
    listHeight: string;
    listMinHeight: number;
}

export const AssetItemNotFound = ({
    noItemsAvailablePlaceholder,
    listHeight,
    listMinHeight,
}: AssetItemNotFoundProps) => (
    <Column
        alignItems="center"
        justifyContent="center"
        height={listHeight}
        minHeight={listMinHeight}
    >
        <Text typographyStyle="body-md">{noItemsAvailablePlaceholder.heading}</Text>
        {noItemsAvailablePlaceholder.body && (
            <Paragraph
                align="center"
                maxWidth={280}
                margin={{
                    top: spacings.xxxs,
                    left: 'auto',
                    right: 'auto',
                }}
            >
                <Text intent="neutral" priority="secondary" typographyStyle="body-sm">
                    {noItemsAvailablePlaceholder.body}
                </Text>
            </Paragraph>
        )}
    </Column>
);
