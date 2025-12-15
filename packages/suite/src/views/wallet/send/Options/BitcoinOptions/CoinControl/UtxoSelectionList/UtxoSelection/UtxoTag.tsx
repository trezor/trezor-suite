import type { ReactNode } from 'react';

import type { IconName } from '@trezor/components';
import { Icon, Tooltip } from '@trezor/components';
import type { CSSColor } from '@trezor/theme';

interface UtxoTagProps {
    icon: IconName;
    iconColor: CSSColor;
    tooltipMessage: ReactNode;
}

export const UtxoTag = ({ icon, iconColor, tooltipMessage }: UtxoTagProps) => (
    <Tooltip content={tooltipMessage}>
        <Icon name={icon} color={iconColor} size={16} />
    </Tooltip>
);
