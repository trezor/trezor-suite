import { type ReactNode } from 'react';

import { Box, Card, Column } from '@trezor/components';

import { ASSET_GROUP_CARD_PADDING } from '../../constants';

export type AssetGroupsCardProps = {
    height: number;
    children: ReactNode;
};

export function AssetGroupsCard({ height, children }: AssetGroupsCardProps) {
    return (
        <Box padding={ASSET_GROUP_CARD_PADDING} height={height}>
            <Card type="flat" paddingType="none">
                <Column gap={0} hasDivider>
                    {children}
                </Column>
            </Card>
        </Box>
    );
}
