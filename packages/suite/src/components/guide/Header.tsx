import React, { useContext } from 'react';
import styled, { css } from 'styled-components';
import { darken, transparentize } from 'polished';
import { analytics, EventType } from '@trezor/suite-analytics';

import * as guideActions from 'src/actions/suite/guideActions';
import { useActions } from 'src/hooks/suite';
import { Icon, variables, useTheme } from '@trezor/components';
import { HeaderBreadcrumb, ContentScrolledContext } from 'src/components/guide';

const HeaderWrapper = styled.div<{ noLabel?: boolean; isScrolled: boolean }>`
    display: flex;
    align-items: center;
    padding: 12px 21px;
    position: sticky;
    top: 0;
    background-color: inherit;
    box-shadow: none;
    border-bottom: 1px solid transparent;
    transition: all 0.5s ease;
    white-space: nowrap;

    ${props =>
        props.isScrolled &&
        css`
            box-shadow: 0px 9px 27px 0px ${props => transparentize(0.5, props.theme.STROKE_GREY)};
            border-bottom: 1px solid ${props => props.theme.STROKE_GREY};
        `}

    ${props =>
        props.noLabel &&
        css`
            justify-content: space-between;
        `}
`;

const ActionButton = styled.button`
    border: 0;
    left: auto;
    padding: 6px;
    border-radius: 8px;
    background: ${props => props.theme.BG_WHITE};
    transition: ${props =>
        `background ${props.theme.HOVER_TRANSITION_TIME} ${props.theme.HOVER_TRANSITION_EFFECT}`};
    cursor: pointer;

    :hover,
    :focus {
        background: ${props => darken(props.theme.HOVER_DARKEN_FILTER, props.theme.BG_WHITE)};
    }
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

    margin: -8px;
`;

interface HeaderProps {
    back?: () => void;
    label?: string | JSX.Element;
    useBreadcrumb?: boolean;
}

export const Header = ({ back, label, useBreadcrumb }: HeaderProps) => {
    const theme = useTheme();

    const isScrolled = useContext(ContentScrolledContext);

    const { close } = useActions({
        close: guideActions.close,
    });

    return (
        <HeaderWrapper noLabel={!label} isScrolled={isScrolled}>
            {!useBreadcrumb && back && (
                <>
                    <ActionButton
                        onClick={() => {
                            back();
                            analytics.report({
                                type: EventType.GuideHeaderNavigation,
                                payload: {
                                    type: 'back',
                                },
                            });
                        }}
                        data-test="@guide/button-back"
                    >
                        <StyledIcon
                            icon="ARROW_LEFT_LONG"
                            size={24}
                            color={theme.TYPE_LIGHT_GREY}
                        />
                    </ActionButton>
                    {label && <Label data-test="@guide/label">{label}</Label>}
                </>
            )}
            {!useBreadcrumb && !back && label && <MainLabel>{label}</MainLabel>}

            {useBreadcrumb && <HeaderBreadcrumb />}

            <ActionButton
                onClick={() => {
                    close();
                    analytics.report({
                        type: EventType.GuideHeaderNavigation,
                        payload: {
                            type: 'close',
                        },
                    });
                }}
                data-test="@guide/button-close"
            >
                <StyledIcon icon="CROSS" size={20} color={theme.TYPE_LIGHT_GREY} />
            </ActionButton>
        </HeaderWrapper>
    );
};
