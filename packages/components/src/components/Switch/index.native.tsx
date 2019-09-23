import React, { FunctionComponent } from 'react';
import { Switch as SwitchNative, SwitchProps } from 'react-native';
import colors from '../../config/colors';

interface Props extends SwitchProps {
    onChange: (checked: boolean) => boolean | void;
    disabled?: boolean;
    isSmall?: boolean;
    checked: boolean;
}

const Switch: FunctionComponent<Props> = ({ onChange, disabled, isSmall, checked, ...rest }) => {
    const smallProps = isSmall ? { transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] } : {};

    const handleChange = (checked: boolean) => {
        onChange(!checked);
    };

    return (
        <SwitchNative
            value={checked}
            disabled={disabled}
            onValueChange={handleChange}
            ios_backgroundColor={colors.TEXT_SECONDARY}
            trackColor={{
                false: colors.TEXT_SECONDARY,
                true: colors.GREEN_PRIMARY,
            }}
            style={smallProps}
            {...rest}
        />
    );
};

export { Switch, Props as SwitchProps };
