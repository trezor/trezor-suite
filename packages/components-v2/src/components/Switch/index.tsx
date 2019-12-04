import React, { useState } from 'react';
import ReactSwitch, { ReactSwitchProps } from 'react-switch';
import colors from '../../config/colors';

interface Props extends ReactSwitchProps {
    onChange: (checked: boolean) => any;
    disabled?: boolean;
    isSmall?: boolean;
}

interface StateProps {
    checked: boolean;
}

const Switch = ({ onChange, disabled, isSmall, ...rest }: Props) => {
    const [checked, setChecked] = useState<StateProps['checked']>(false);
    const smallProps = isSmall
        ? {
              width: 36,
              height: 18,
              handleDiameter: 14,
          }
        : {};

    const handleChange = (checked: boolean) => {
        onChange(checked);
        setChecked(checked);
    };

    return (
        <ReactSwitch
            checked={checked}
            disabled={disabled}
            onChange={handleChange}
            onColor={colors.GREEN}
            {...smallProps}
            {...rest}
        />
    );
};

export { Switch, Props as SwitchProps };
