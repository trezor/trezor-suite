import { FloatingArrow } from '@floating-ui/react';

import { type ArrowProps } from './TooltipFloatingUi';

type TooltipArrowProps = ArrowProps & {
    fill: string;
};

export const TooltipArrow = ({ ref, context, fill }: TooltipArrowProps) => (
    <FloatingArrow ref={ref} context={context} fill={fill} strokeWidth={0} tipRadius={1} />
);
