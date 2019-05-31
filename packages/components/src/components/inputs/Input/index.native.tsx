/* eslint-disable no-unused-vars */
import React from 'react';
// import styled, { css } from 'styled-components/native';
import PropTypes from 'prop-types';
import { FeedbackState } from '../../../support/types';

interface InputProps {
    hasIcon?: boolean;
    hasAddon?: boolean;
    isPartiallyHidden?: boolean;
    isSmallText?: boolean;
    border?: string;
    tooltipAction?: React.ReactNode;
}

// TODO: proper types for wrapperProps (should be same as React.HTMLAttributes<HTMLDivElement>)
interface Props extends React.HTMLAttributes<HTMLInputElement>, FeedbackState {
    innerRef?: any;
    height?: number;
    icon?: any;
    bottomText?: React.ReactNode;
    topLabel?: React.ReactNode;
    tooltipAction?: React.ReactNode;
    sideAddons?: React.ReactNode[];
    isDisabled?: boolean;
    isSmallText?: boolean;
    isPartiallyHidden?: boolean;
    wrapperProps?: Record<string, any>;
}

const Input = ({
    className,
    innerRef,
    height = 40,
    icon,
    state,
    bottomText,
    topLabel,
    tooltipAction,
    sideAddons,
    isDisabled,
    isSmallText,
    isPartiallyHidden,
    wrapperProps,
    ...rest
}: Props) => {
    return null;
};

Input.propTypes = {
    className: PropTypes.string,
    innerRef: PropTypes.func,
    placeholder: PropTypes.string,
    type: PropTypes.string,
    height: PropTypes.number,
    autocorrect: PropTypes.string,
    autocapitalize: PropTypes.string,
    icon: PropTypes.node,
    spellCheck: PropTypes.string,
    value: PropTypes.string,
    readOnly: PropTypes.bool,
    onChange: PropTypes.func,
    state: PropTypes.oneOf(['info', 'success', 'warning', 'error']),
    bottomText: PropTypes.node,
    topLabel: PropTypes.node,
    tooltipAction: PropTypes.node,
    sideAddons: PropTypes.arrayOf(PropTypes.node),
    isDisabled: PropTypes.bool,
    name: PropTypes.string,
    isSmallText: PropTypes.bool,
    isPartiallyHidden: PropTypes.bool,
};

export default Input;
