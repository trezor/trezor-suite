import React from 'react';
import styled, { css } from 'styled-components';
import { darken } from 'polished';

import * as guideActions from '@suite-actions/guideActions';
import { useActions, useAnalytics } from '@suite-hooks';
import { Icon, variables, useTheme } from '@trezor/components';

const HeaderWrapper = styled.div<{ noLabel?: boolean }>`
    display: flex;
    align-items: center;
    padding: 20px 22px 20px 22px;
    ${props =>
        props.noLabel &&
        css`
            justify-content: space-between;
        `}
`;

const ActionButton = styled.button`
    border: 0;
    background: none;
    left: auto;
    cursor: pointer;
`;

const MainLabel = styled.div`
    font-size: ${variables.FONT_SIZE.BIG};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    text-align: left;
    color: ${props => props.theme.TYPE_DARK_GREY};
    width: 100%;
`;

const Label = styled.div`
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    text-align: center;
    color: ${props => props.theme.TYPE_DARK_GREY};
    padding: 0 15px;
    width: 100%;
`;

const StyledIcon = styled(Icon)`
    width: 40px;
    height: 40px;
    flex-grow: 0;
    padding: 8px;
    border-radius: 6px;
    margin: 0 -8px;
    background: ${props => props.theme.BG_WHITE};
    transition: ${props =>
        `background ${props.theme.HOVER_TRANSITION_TIME} ${props.theme.HOVER_TRANSITION_EFFECT}`};

    &:hover {
        background: ${props => darken(props.theme.HOVER_DARKEN_FILTER, props.theme.BG_WHITE)};
    }
`;

interface Props {
    back?: () => void;
    label?: string | JSX.Element;
}

const Header = ({ back, label }: Props) => {
    const theme = useTheme();
    const analytics = useAnalytics();

    const { close } = useActions({
        close: guideActions.close,
    });

    return (
        <HeaderWrapper noLabel={!label}>
            {back && (
                <>
                    <ActionButton
                        onClick={() => {
                            back();
                            analytics.report({
                                type: 'guide/header/navigation',
                                payload: {
                                    type: 'back',
                                },
                            });
                        }}
                    >
                        <StyledIcon
                            icon="ARROW_LEFT_LONG"
                            size={24}
                            color={theme.TYPE_LIGHT_GREY}
                        />
                    </ActionButton>
                    {label && <Label>{label}</Label>}
                </>
            )}
            {!back && label && <MainLabel>{label}</MainLabel>}
            <ActionButton
                onClick={() => {
                    close();
                    analytics.report({
                        type: 'guide/header/navigation',
                        payload: {
                            type: 'close',
                        },
                    });
                }}
            >
                <StyledIcon icon="CROSS" size={24} color={theme.TYPE_LIGHT_GREY} />
            </ActionButton>
        </HeaderWrapper>
    );
};

export default Header;
