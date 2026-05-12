import { FloatingArrow } from '@floating-ui/react';

import { paletteV2 } from '@trezor/theme';

import { type ArrowProps } from './TooltipFloatingUi';

export const TooltipArrow = ({ ref, context }: ArrowProps) => (
    <FloatingArrow
        ref={ref}
        context={context}
        fill={paletteV2.darkCoolGrey50}
        strokeWidth={0}
        tipRadius={1}
    />
);
