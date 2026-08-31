import { type ReactNode } from 'react';

import { selectIsDiscreteModeActive } from '@suite-common/discreet-mode';
import { useSelector } from '@suite-common/redux-utils';
import { TOOLTIP_DELAY_LONG, TruncateWithTooltip } from '@trezor/components';
type TruncatedAmountProps = {
    children: ReactNode;
};

// Ellipsis + hover tooltip for read-only amounts so a long value can't stretch the layout.
// Skips the tooltip in discreet mode so a hidden amount can't be revealed on hover (matches BaseCurrency).
export const TruncatedAmount = ({ children }: TruncatedAmountProps) => {
    const isDiscreetMode = useSelector(selectIsDiscreteModeActive);

    if (isDiscreetMode) {
        return <>{children}</>;
    }

    return <TruncateWithTooltip delayShow={TOOLTIP_DELAY_LONG}>{children}</TruncateWithTooltip>;
};
