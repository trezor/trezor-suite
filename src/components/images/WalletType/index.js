import React from 'react';
import PropTypes from 'prop-types';
import { Icon, colors, icons } from 'trezor-ui-components';

const WalletType = ({
    type = 'standard',
    size = 14,
    color = colors.TEXT_SECONDARY,
    hoverColor,
    onClick,
    ...rest
}) => {
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

WalletType.propTypes = {
    type: PropTypes.string,
    size: PropTypes.number,
    color: PropTypes.string,
    hoverColor: PropTypes.string,
    onClick: PropTypes.func,
};

export default WalletType;
