import { useContext } from 'react';
import styled, { css } from 'styled-components';
import { transparentize } from 'polished';
import { analytics, EventType } from '@trezor/suite-analytics';

import { close } from 'src/actions/suite/guideActions';
import { useDispatch } from 'src/hooks/suite';
import { IconButton, variables } from '@trezor/components';
import { HeaderBreadcrumb, ContentScrolledContext } from 'src/components/guide';
import { typography } from '@trezor/theme';

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

const MainLabel = styled.div`
    ${typography.titleSmall};
    flex: 1;
`;

const Label = styled.div`
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    text-align: center;
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    padding: 0 15px;
    width: 100%;
`;

interface GuideHeaderProps {
    back?: () => void;
    label?: string | JSX.Element;
    useBreadcrumb?: boolean;
}

export const GuideHeader = ({ back, label, useBreadcrumb }: GuideHeaderProps) => {
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
                    <IconButton
                        size="medium"
                        icon="ARROW_LEFT_LONG"
                        onClick={goBack}
                        variant="tertiary"
                        data-test-id="@guide/button-back"
                    />

                    {label && <Label data-test-id="@guide/label">{label}</Label>}
                </>
            )}
            {!useBreadcrumb && !back && label && <MainLabel>{label}</MainLabel>}

            {useBreadcrumb && <HeaderBreadcrumb />}

            <IconButton
                icon="ARROW_RIGHT_LINE"
                variant="tertiary"
                onClick={handleClose}
                data-test-id="@guide/button-close"
                size="medium"
            />
        </HeaderWrapper>
    );
};
