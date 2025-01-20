import { Placement } from '@floating-ui/react';

export const POPOVER_PLACEMENT_POSITION = ['top', 'right', 'bottom', 'left', 'center'] as const;
export type PopoverPlacementPosition = (typeof POPOVER_PLACEMENT_POSITION)[number];

export const POPOVER_PLACEMENT_ALIGNMENT = ['start', 'center', 'end'] as const;
export type PopoverPlacementAlignment = (typeof POPOVER_PLACEMENT_ALIGNMENT)[number];

export type PopoverPlacement = {
    position: PopoverPlacementPosition;
    alignment?: PopoverPlacementAlignment;
};

export const convertPopoverPlacement = ({
    position,
    alignment = 'center',
}: PopoverPlacement): Placement => {
    if (position === 'center' && alignment === 'center') {
        return 'bottom';
    }

    if (position === 'center') {
        return `bottom-${alignment}` as Placement;
    }

    if (alignment === 'center') {
        return position as Placement;
    }

    return `${position}-${alignment}` as Placement;
};
