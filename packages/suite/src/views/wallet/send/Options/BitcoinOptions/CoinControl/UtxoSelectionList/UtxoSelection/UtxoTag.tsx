import { ReactNode } from 'react';

import { Icon, IconName, Tooltip } from '@trezor/components';
import { CSSColor } from '@trezor/theme';

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
