import React from 'react';
import { useTheme, Icon, Tooltip, IconType } from '@trezor/components';

interface UtxoTagProps {
    icon: IconType;
    tooltipMessage: React.ReactNode;
}

export const UtxoTag = ({ icon, tooltipMessage }: UtxoTagProps) => {
    const theme = useTheme();

    return (
        <Tooltip interactive={false} content={tooltipMessage}>
            <Icon icon={icon} color={theme.TYPE_DARK_GREY} size={16} />
        </Tooltip>
    );
};
