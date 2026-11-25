import { Box } from '@trezor/components';
import { type Color } from '@trezor/theme';

type StakingSplitLegendSquareProps = {
    color: Color;
};

export const StakingSplitLegendSquare = ({ color }: StakingSplitLegendSquareProps) => (
    <Box width={12} height={12} borderRadius={4} backgroundColor={color} />
);
