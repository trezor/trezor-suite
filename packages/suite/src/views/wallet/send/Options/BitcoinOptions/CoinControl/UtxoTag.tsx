import { ReactNode } from 'react';
import { Icon, Tooltip, IconName } from '@trezor/components';

interface UtxoTagProps {
    icon: IconName;
    iconColor: string;
    tooltipMessage: ReactNode;
}

export const UtxoTag = ({ icon, iconColor, tooltipMessage }: UtxoTagProps) => (
    <Tooltip content={tooltipMessage}>
        <Icon name={icon} color={iconColor} size={16} />
    </Tooltip>
);
