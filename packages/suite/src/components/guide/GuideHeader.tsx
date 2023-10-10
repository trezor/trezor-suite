import { useContext } from 'react';
import styled, { css, useTheme } from 'styled-components';
import { darken, transparentize } from 'polished';
import { analytics, EventType } from '@trezor/suite-analytics';

import { close } from 'src/actions/suite/guideActions';
import { useDispatch } from 'src/hooks/suite';
import { Icon, variables } from '@trezor/components';
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

    ${({ isScrolled }) =>
        isScrolled &&
        css`
            box-shadow: 0 9px 27px 0 ${({ theme }) => transparentize(0.5, theme.STROKE_GREY)};
            border-bottom: 1px solid ${({ theme }) => theme.STROKE_GREY};
        `}

    ${({ noLabel }) =>
        noLabel &&
        css`
            justify-content: space-between;
        `}
`;

const ActionButton = styled.button`
    border: 0;
    left: auto;
    padding: 6px;
    border-radius: 8px;
    background: ${({ theme }) => theme.BG_WHITE};
    transition: ${({ theme }) =>
        `background ${theme.HOVER_TRANSITION_TIME} ${theme.HOVER_TRANSITION_EFFECT}`};
    cursor: pointer;

    :hover,
    :focus {
        background: ${({ theme }) => darken(theme.HOVER_DARKEN_FILTER, theme.BG_WHITE)};
    }
`;

const MainLabel = styled.div`
    font-size: ${variables.FONT_SIZE.BIG};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    text-align: left;
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    width: 100%;
`;

const Label = styled.div`
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    text-align: center;
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    padding: 0 15px;
    width: 100%;
`;

const StyledIcon = styled(Icon)`
    width: 40px;
    height: 40px;
    flex-grow: 0;

    margin: -8px;
`;

interface GuideHeaderProps {
    back?: () => void;
    label?: string | JSX.Element;
    useBreadcrumb?: boolean;
}

export const GuideHeader = ({ back, label, useBreadcrumb }: GuideHeaderProps) => {
    const theme = useTheme();
    const dispatch = useDispatch();
    const isScrolled = useContext(ContentScrolledContext);

    const goBack = () => {
        back?.();
        analytics.report({
            type: EventType.GuideHeaderNavigation,
            payload: {
                type: 'back',
            },
        });
    };
    const handleClose = () => {
        dispatch(close());
        analytics.report({
            type: EventType.GuideHeaderNavigation,
            payload: {
                type: 'close',
            },
        });
    };

    return (
        <HeaderWrapper noLabel={!label} isScrolled={isScrolled}>
            {!useBreadcrumb && back && (
                <>
                    <ActionButton onClick={goBack} data-test="@guide/button-back">
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

            <ActionButton onClick={handleClose} data-test="@guide/button-close">
                <StyledIcon icon="CROSS" size={20} color={theme.TYPE_LIGHT_GREY} />
            </ActionButton>
        </HeaderWrapper>
    );
};
