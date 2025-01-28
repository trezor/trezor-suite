import { FloatingArrow } from '@floating-ui/react';

import { palette } from '@trezor/theme';

import { TOOLTIP_BORDER_RADIUS } from './TooltipBox';
import { ArrowProps } from './TooltipFloatingUi';

export const TooltipArrow = ({ ref, context }: ArrowProps) => (
    <FloatingArrow
        ref={ref}
        context={context}
        fill={palette.darkGray300}
        stroke={palette.darkGray100}
        staticOffset={TOOLTIP_BORDER_RADIUS}
        strokeWidth={0}
        tipRadius={1}
        style={{
            transform: 'translateY(-2px)',
        }}
    />
);
