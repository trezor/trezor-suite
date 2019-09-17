import React, { FunctionComponent, useState } from 'react';
import PropTypes from 'prop-types';
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

const Switch: FunctionComponent<Props> = ({ onChange, disabled, isSmall, ...rest }) => {
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
            onColor={colors.GREEN_PRIMARY}
            {...smallProps}
            {...rest}
        />
    );
};

Switch.propTypes = {
    onChange: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
    isSmall: PropTypes.bool,
};

export { Switch, Props as SwitchProps };
