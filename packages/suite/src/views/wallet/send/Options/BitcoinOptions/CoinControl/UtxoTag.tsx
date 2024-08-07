import { ReactNode } from 'react';
import { Icon, Tooltip, IconType } from '@trezor/components';

interface UtxoTagProps {
    icon: IconType;
    iconColor: string;
    tooltipMessage: ReactNode;
}

export const UtxoTag = ({ icon, iconColor, tooltipMessage }: UtxoTagProps) => (
    <Tooltip content={tooltipMessage}>
        <Icon icon={icon} color={iconColor} size={16} />
    </Tooltip>
);
