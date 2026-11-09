import { type ReactNode } from 'react';

import { Box, PictogramTitleHeader } from '@suite-native/atoms';

export type TradingAssetListEmptyComponentProps = {
    subtitle: ReactNode;
    title: ReactNode;
};

export const TradingAssetListEmptyComponent = ({
    subtitle,
    title,
}: TradingAssetListEmptyComponentProps) => (
    <Box padding="sp32" alignContent="center" justifyContent="center">
        <PictogramTitleHeader
            variant="info"
            icon="magnifyingGlass"
            title={title}
            subtitle={subtitle}
        />
    </Box>
);
