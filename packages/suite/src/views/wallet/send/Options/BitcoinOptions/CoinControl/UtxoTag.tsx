import { ReactNode } from 'react';
import { IconLegacy, Tooltip, IconLegacyType } from '@trezor/components';

interface UtxoTagProps {
    icon: IconLegacyType;
    iconColor: string;
    tooltipMessage: ReactNode;
}

export const UtxoTag = ({ icon, iconColor, tooltipMessage }: UtxoTagProps) => (
    <Tooltip content={tooltipMessage}>
        <IconLegacy icon={icon} color={iconColor} size={16} />
    </Tooltip>
);
