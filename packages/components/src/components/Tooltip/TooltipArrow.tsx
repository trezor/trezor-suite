import { FloatingArrow } from '@floating-ui/react';

import { palette } from '@trezor/theme';

import { ArrowProps } from './TooltipFloatingUi';
import { TOOLTIP_BORDER_RADIUS } from './TooltipBox';

export const TooltipArrow = ({ ref, context }: ArrowProps) => (
    <FloatingArrow
        ref={ref}
        context={context}
        fill={palette.darkGray300}
        stroke={palette.darkGray100}
        staticOffset={TOOLTIP_BORDER_RADIUS}
        strokeWidth={1}
        tipRadius={1}
        style={{
            transform: 'translateY(-2px)',
        }}
    />
);
