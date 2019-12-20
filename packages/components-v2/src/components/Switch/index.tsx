import React, { useState } from 'react';
import ReactSwitch, { ReactSwitchProps } from 'react-switch';
import colors from '../../config/colors';
import styled, { css } from 'styled-components';

const StyledReactSwitch = styled(({ isSmall, ...rest }) => <ReactSwitch {...rest} />)<
    Pick<Props, 'isSmall'>
>`
    .react-switch-handle {
        top: 3px !important;
        border: solid 1px ${colors.WHITE} !important;
        background-image: linear-gradient(to top, ${colors.BLACK96}, ${colors.WHITE}) !important;

        ${props =>
            props.checked &&
            css`
                transform: ${props.isSmall
                    ? 'translateX(17px) !important'
                    : 'translateX(20px) !important'};
            `}

        ${props =>
            !props.checked &&
            css`
                transform: ${props.isSmall
                    ? 'translateX(3px) !important'
                    : 'translateX(4px) !important'};
            `}
    }
`;

interface Props extends ReactSwitchProps {
    onChange: (checked: boolean) => any;
    isDisabled?: boolean;
    isSmall?: boolean;
}

interface StateProps {
    checked: boolean;
}

const Switch = ({ onChange, isDisabled, isSmall, ...rest }: Props) => {
    const [checked, setChecked] = useState<StateProps['checked']>(false);
    const handleChange = (checked: boolean) => {
        onChange(checked);
        setChecked(checked);
    };

    return (
        <StyledReactSwitch
            checked={checked}
            disabled={isDisabled}
            onChange={handleChange}
            onColor={colors.GREEN}
            checkedIcon={false}
            uncheckedIcon={false}
            offColor={colors.BLACK70}
            color={colors.GREEN}
            width={isSmall ? 32 : 42}
            height={isSmall ? 18 : 24}
            handleDiameter={isSmall ? 10 : 16}
            boxShadow="0 2px 4px 0 rgba(0, 0, 0, 0.5)"
            activeBoxShadow="0 2px 4px 0 rgba(0, 0, 0, 0.8)"
            {...rest}
        />
    );
};

export { Switch, Props as SwitchProps };
