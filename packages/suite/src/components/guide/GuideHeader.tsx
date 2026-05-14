import { type JSX, useContext } from 'react';

import styled, { css } from 'styled-components';

import { events } from '@suite/analytics';
import { IconButton, useElevation } from '@trezor/components';
import { type Elevation, mapElevationToBorder, typography, zIndices } from '@trezor/theme';

import { close } from 'src/actions/suite/guideActions';
import { ContentScrolledContext, HeaderBreadcrumb } from 'src/components/guide';
import { useDispatch } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';

const HeaderWrapper = styled.div<{
    $noLabel?: boolean;
    $isScrolled: boolean;
    $elevation: Elevation;
}>`
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
    z-index: ${zIndices.base}; /* Prevents search bar from overlapping when scrolling */

    ${({ $isScrolled, $elevation, theme }) =>
        $isScrolled &&
        css`
            box-shadow: ${({ theme }) => theme.boxShadowBase};
            border-bottom: 1px solid ${mapElevationToBorder({ theme, $elevation })};
        `}

    ${({ $noLabel }) =>
        $noLabel &&
        css`
            justify-content: space-between;
        `}
`;

const MainLabel = styled.div`
    ${typography['headline-sm']};
    flex: 1;
`;

const Label = styled.div`
    ${typography['body-sm-strong']}
    text-align: center;
    color: ${({ theme }) => theme.contentPrimary};
    padding: 0 15px;
    width: 100%;
`;

interface GuideHeaderProps {
    back?: () => void;
    label?: string | JSX.Element;
    useBreadcrumb?: boolean;
}

export const GuideHeader = ({ back, label, useBreadcrumb }: GuideHeaderProps) => {
    const analytics = useAnalytics();
    const { elevation } = useElevation();
    const dispatch = useDispatch();
    const isScrolled = useContext(ContentScrolledContext);

    const goBack = () => {
        back?.();
        analytics.report({
            type: events.guideHeaderNavigationEvent.name,
            payload: {
                type: 'back',
            },
        });
    };
    const handleClose = () => {
        dispatch(close());
        analytics.report({
            type: events.guideHeaderNavigationEvent.name,
            payload: {
                type: 'close',
            },
        });
    };

    return (
        <HeaderWrapper $noLabel={!label} $isScrolled={isScrolled} $elevation={elevation}>
            {!useBreadcrumb && back && (
                <>
                    <IconButton
                        icon="arrowLeft"
                        onClick={goBack}
                        intent="neutral"
                        priority="secondary"
                        data-testid="@guide/button-back"
                    />

                    {label && <Label data-testid="@guide/label">{label}</Label>}
                </>
            )}
            {!useBreadcrumb && !back && label && <MainLabel>{label}</MainLabel>}

            {useBreadcrumb && <HeaderBreadcrumb />}

            <IconButton
                icon="x"
                intent="neutral"
                priority="secondary"
                onClick={handleClose}
                data-testid="@guide/button-close"
            />
        </HeaderWrapper>
    );
};
