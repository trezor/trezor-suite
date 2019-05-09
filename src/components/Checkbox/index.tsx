import React, { PureComponent } from 'react';
import styled, { css } from 'styled-components';

import PropTypes from 'prop-types';
import { FONT_SIZE } from 'config/variables';
import Icon from 'components/Icon';
import colors from 'config/colors';
import icons from 'config/icons';
import { Omit } from 'support/types';

const Wrapper = styled.div`
    display: flex;
    flex-direction: row;
    cursor: pointer;
    align-items: center;

    &:hover,
    &:focus {
        outline: none;
    }
`;

const IconWrapper = styled.div<IconWrapperProps>`
    display: flex;
    border-radius: 2px;
    justify-content: center;
    align-items: center;
    color: ${props => (props.isChecked ? colors.WHITE : colors.GREEN_PRIMARY)};
    background: ${props => (props.isChecked ? colors.GREEN_PRIMARY : colors.WHITE)};
    border: 1px solid ${props => (props.isChecked ? colors.GREEN_PRIMARY : colors.DIVIDER)};
    width: 24px;
    height: 24px;

    &:hover,
    &:focus {
        ${props =>
            !props.isChecked &&
            css`
                border: 1px solid ${colors.GREEN_PRIMARY};
            `}
        background: ${props => (props.isChecked ? colors.GREEN_PRIMARY : colors.WHITE)};
    }
`;

const Label = styled.div<IconWrapperProps>`
    display: flex;
    padding-left: 10px;
    justify-content: center;
    ${colors.TEXT_SECONDARY};
    font-size: ${FONT_SIZE.BASE};

    &:hover,
    &:focus {
        color: ${props => (props.isChecked ? colors.TEXT_PRIMARY : colors.TEXT_PRIMARY)};
    }
`;

interface Props extends React.HTMLAttributes<HTMLDivElement> {
    onClick: (event: React.KeyboardEvent<HTMLElement> | React.MouseEvent<HTMLElement>) => any;
    isChecked: boolean;
    propTypes: any;
}

type IconWrapperProps = Omit<Props, 'onClick' | 'propTypes'>;

class Checkbox extends PureComponent<Props> {
    static propTypes = {
        onClick: PropTypes.func.isRequired,
        isChecked: PropTypes.bool,
        children: PropTypes.node,
    };

    handleKeyboard(event: React.KeyboardEvent<HTMLElement>) {
        if (event.keyCode === 32) {
            this.props.onClick(event);
        }
    }

    render() {
        const { isChecked, children, onClick, ...rest } = this.props;
        return (
            <Wrapper
                onClick={onClick}
                onKeyUp={event => this.handleKeyboard(event)}
                tabIndex={0}
                {...rest}
            >
                <IconWrapper isChecked={isChecked}>
                    {isChecked && (
                        <Icon
                            hoverColor={colors.WHITE}
                            size={10}
                            color={isChecked ? colors.WHITE : colors.GREEN_PRIMARY}
                            icon={icons.SUCCESS}
                        />
                    )}
                </IconWrapper>
                <Label isChecked={isChecked}>{children}</Label>
            </Wrapper>
        );
    }
}

export default Checkbox;
