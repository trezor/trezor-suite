import { FloatingArrow } from '@floating-ui/react';

import { paletteV1 } from '@trezor/theme';

import { TOOLTIP_BORDER_RADIUS } from './TooltipBox';
import { ArrowProps } from './TooltipFloatingUi';

export const TooltipArrow = ({ ref, context }: ArrowProps) => (
    <FloatingArrow
        ref={ref}
        context={context}
        fill={paletteV1.darkGray300}
        stroke={paletteV1.darkGray100}
        staticOffset={TOOLTIP_BORDER_RADIUS}
        strokeWidth={0}
        tipRadius={1}
        style={{
            transform: 'translateY(-2px)',
        }}
    />
);
