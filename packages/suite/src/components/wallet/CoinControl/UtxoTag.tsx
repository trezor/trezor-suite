import React from 'react';
import { Icon, Tooltip, IconType } from '@trezor/components';

interface UtxoTagProps {
    icon: IconType;
    iconColor: string;
    tooltipMessage: React.ReactNode;
}

export const UtxoTag = ({ icon, iconColor, tooltipMessage }: UtxoTagProps) => (
    <Tooltip interactive={false} content={tooltipMessage}>
        <Icon icon={icon} color={iconColor} size={16} />
    </Tooltip>
);
