import React from 'react';
import styled from 'styled-components';
import { useActions } from '@suite-hooks';
import * as routerActions from '@suite-actions/routerActions';
import { variables, Icon } from '@trezor/components';
import { darken } from 'polished';

const { FONT_WEIGHT, FONT_SIZE } = variables;

const StyledBackLink = styled.div`
    cursor: pointer;
    font-size: ${FONT_SIZE.SMALL};
    color: ${props => props.theme.TYPE_DARK_GREY};
    font-weight: ${FONT_WEIGHT.MEDIUM};
    display: flex;
    align-items: center;
    white-space: nowrap;
    margin-left: 10px;
    background: ${props => props.theme.STROKE_GREY};
    border-radius: 5px;
    padding: 8px;
    transition: ${props =>
        `background ${props.theme.HOVER_TRANSITION_TIME} ${props.theme.HOVER_TRANSITION_EFFECT}`};

    &:hover {
        background: ${props => darken(props.theme.HOVER_DARKEN_FILTER, props.theme.STROKE_GREY)};
    }
`;

const StyledIcon = styled(Icon)``;

const AccountFormCloseButton = () => {
    const { goto } = useActions({
        goto: routerActions.goto,
    });
    return (
        <StyledBackLink onClick={() => goto('wallet-index', undefined, true)}>
            <StyledIcon icon="CROSS" size={16} />
        </StyledBackLink>
    );
};

export default AccountFormCloseButton;
