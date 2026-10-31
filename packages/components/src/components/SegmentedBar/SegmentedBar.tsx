import { type Color, type SpacingValue } from '@trezor/theme';

import { type FrameProps, type FramePropsKeys } from '../../utils/frameProps';
import { Box } from '../Box/Box';
import { Row } from '../Flex/Flex';

export const allowedSegmentedBarFrameProps = [
    'margin',
    'width',
    'maxWidth',
] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedSegmentedBarFrameProps)[number]>;

export type SegmentedBarSegment = {
    value: number;
    color: Color;
};

export type SegmentedBarProps = AllowedFrameProps & {
    segments: readonly SegmentedBarSegment[];
    height?: number;
    gap?: SpacingValue;
    'data-testid'?: string;
};

export const SegmentedBar = ({
    segments,
    height = 6,
    gap = 4,
    'data-testid': dataTestId,
    ...rest
}: SegmentedBarProps) => (
    <Row gap={gap} data-component="SegmentedBar" data-testid={dataTestId} {...rest}>
        {segments
            .filter(({ value }) => value > 0)
            .map(({ value, color }, index) => (
                <Box
                    key={index}
                    flex={`${value}`}
                    height={height}
                    borderRadius="full"
                    backgroundColor={color}
                />
            ))}
    </Row>
);
