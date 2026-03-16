import { FloatingArrow } from '@floating-ui/react';

import { paletteV2 } from '@trezor/theme';

import { TOOLTIP_BORDER_RADIUS } from './TooltipBox';
import { type ArrowProps } from './TooltipFloatingUi';

export const TooltipArrow = ({ ref, context }: ArrowProps) => (
    <FloatingArrow
        ref={ref}
        context={context}
        fill={paletteV2.darkCoolGrey50}
        staticOffset={TOOLTIP_BORDER_RADIUS}
        strokeWidth={0}
        tipRadius={1}
        style={{
            transform: 'translateY(-2px)',
        }}
    />
);
