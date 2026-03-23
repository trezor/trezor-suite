import { type ReactElement, type ReactNode } from 'react';

import { Box } from '../Box/Box';
import { Column, Row } from '../Flex/Flex';
import { Text } from '../typography/Text/Text';

export const TOOLTIP_BORDER_RADIUS = 12;

export type TooltipBoxProps = {
    content: ReactNode;
    tooltipMaxWidth?: string | number;
    addon?: ReactNode;
    title?: ReactElement;
};

type TooltipBoxExtendedProps = TooltipBoxProps & Required<Pick<TooltipBoxProps, 'tooltipMaxWidth'>>;

export const TooltipBox = ({ addon, tooltipMaxWidth, content, title }: TooltipBoxExtendedProps) => {
    const hasTitleOrAddon = title || addon;

    return (
        <Box
            maxWidth={tooltipMaxWidth}
            tabIndex={-1}
            borderRadius={TOOLTIP_BORDER_RADIUS}
            backgroundColor="baseFillSurfaceModeless"
            padding={hasTitleOrAddon ? 12 : { vertical: 6, horizontal: 8 }}
        >
            <Column gap={12}>
                {hasTitleOrAddon && (
                    <Row gap={12} justifyContent="space-between">
                        {title && (
                            <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                                {title}
                            </Text>
                        )}
                        {addon && <Box margin={{ left: 'auto' }}>{addon}</Box>}
                    </Row>
                )}

                <Text typographyStyle="body-sm" as="div" intent="neutral" overflowWrap="anywhere">
                    {content}
                </Text>
            </Column>
        </Box>
    );
};
