import { useTheme } from 'styled-components';

import { Box, Row } from '@trezor/components';

import { ASSET_ROW_HEIGHT } from '../../constants';

type ItemClickableContainerProps = {
    children: React.ReactNode;
    onClick: () => void;
};

export function ItemClickableContainer({ children, onClick }: ItemClickableContainerProps) {
    const theme = useTheme();

    return (
        <Box
            borderRadius={10}
            width="100%"
            height={ASSET_ROW_HEIGHT - 8}
            padding={8}
            onClick={e => {
                e.stopPropagation();
                onClick();
            }}
            as="button"
            cursor="pointer"
            backgroundColorOnInteraction={theme.backgroundTertiaryPressedOnElevation0}
        >
            <Row justifyContent="space-between" gap={12} height="100%">
                {children}
            </Row>
        </Box>
    );
}
