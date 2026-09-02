import { type ReactNode } from 'react';

import { ThemeProvider } from 'styled-components';

import { intermediaryTheme } from '../../config/colors';
import { Box } from '../Box/Box';
import { Column, Row } from '../Flex/Flex';
import { Text } from '../typography/Text/Text';

export type TooltipBoxProps = {
    content: ReactNode;
    tooltipMaxWidth?: string | number;
    addon?: ReactNode;
};

type TooltipBoxExtendedProps = TooltipBoxProps & Required<Pick<TooltipBoxProps, 'tooltipMaxWidth'>>;

const tooltipContentTheme = { ...intermediaryTheme.dark, variant: 'dark' as const };

export const TooltipBox = ({ addon, tooltipMaxWidth, content }: TooltipBoxExtendedProps) => (
    <Box
        maxWidth={tooltipMaxWidth}
        tabIndex={-1}
        borderRadius={12}
        backgroundColor="surfaceFillModelessNeutralDark"
        borderColor="surfaceBorderModelessNeutralDark"
        borderWidth={1}
        shadow="surfaceShadowModeless"
        padding={{ vertical: 6, horizontal: 8 }}
    >
        <ThemeProvider theme={tooltipContentTheme}>
            <Column gap={6}>
                <Text typographyStyle="body-sm" as="div" intent="neutral" overflowWrap="anywhere">
                    {content}
                </Text>
                {addon && <Row>{addon}</Row>}
            </Column>
        </ThemeProvider>
    </Box>
);
