import React, { useState } from 'react';
import ReactSwitch, { ReactSwitchProps } from 'react-switch';
import colors from '../../config/colors';
import styled, { css } from 'styled-components';

const StyledReactSwitch = styled(ReactSwitch)`
    .react-switch-bg {
        background: ${props => (props.checked ? colors.GREEN : colors.BLACK70)} !important;
    }

    .react-switch-handle {
        top: 3px !important;
        width: 15.4px !important;
        height: 16px !important;
        box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.5);
        border: solid 1px ${colors.WHITE} !important;
        background-image: linear-gradient(to top, ${colors.BLACK96}, ${colors.WHITE}) !important;

        ${props =>
            props.checked &&
            css`
                transform: translateX(22px) !important;
            `}

        ${props =>
            !props.checked &&
            css`
                left: 2px;
            `}
    }
`;

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
        <StyledReactSwitch
            checked={checked}
            disabled={disabled}
            onChange={handleChange}
            onColor={colors.GREEN}
            checkedIcon={false}
            uncheckedIcon={false}
            width={42}
            height={24}
            {...smallProps}
            {...rest}
        />
    );
};

export { Switch, Props as SwitchProps };
