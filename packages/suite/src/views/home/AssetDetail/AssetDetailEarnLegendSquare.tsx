import { Box } from '@trezor/components';
import { type Color } from '@trezor/theme';

type AssetDetailEarnLegendSquareProps = {
    color: Color;
};

export const AssetDetailEarnLegendSquare = ({ color }: AssetDetailEarnLegendSquareProps) => (
    <Box width={12} height={12} borderRadius={4} backgroundColor={color} />
);
