import React from 'react';
import { Icon, colors, icons } from '@trezor/components';

interface Props {
    type: string;
    size: number;
    color: string;
    hoverColor: string;
}

const WalletType = ({
    type = 'standard',
    size = 14,
    color = colors.TEXT_SECONDARY,
    hoverColor,
    onClick,
    ...rest
}: Props) => {
    const icon = type === 'hidden' ? icons.WALLET_HIDDEN : icons.WALLET_STANDARD;
    return (
        <Icon
            icon={icon}
            hoverColor={hoverColor}
            onClick={onClick}
            color={color}
            size={size}
            {...rest}
        />
    );
};

export default WalletType;
