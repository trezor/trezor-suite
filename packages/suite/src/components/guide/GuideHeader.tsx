import { type JSX } from 'react';

import styled, { css } from 'styled-components';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import { H3, IconButton, Paragraph } from '@trezor/components';
import { ArrowLeftIcon, XIcon } from '@trezor/icons';
import { zIndices } from '@trezor/theme';

import { close } from 'src/actions/suite/guideActions';
import { useDispatch } from 'src/hooks/suite';

const HeaderWrapper = styled.div<{
    $noLabel?: boolean;
}>`
    display: flex;
    align-items: center;
    padding: 12px 16px;
    position: sticky;
    top: 0;
    background-color: inherit;
    white-space: nowrap;
    z-index: ${zIndices.base}; /* Prevents search bar from overlapping when scrolling */

    ${({ $noLabel }) =>
        $noLabel &&
        css`
            justify-content: space-between;
        `}
`;

interface GuideHeaderProps {
    back?: () => void;
    label?: string | JSX.Element;
}

export const GuideHeader = ({ back, label }: GuideHeaderProps) => {
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const dispatch = useDispatch();

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
        <HeaderWrapper $noLabel={!label}>
            {back && (
                <>
                    <IconButton
                        icon={ArrowLeftIcon}
                        onClick={goBack}
                        intent="neutral"
                        priority="secondary"
                        data-testid="@guide/button-back"
                        tooltip={{ content: <Translation id="TR_BACK" /> }}
                    />

                    {label && (
                        <Paragraph
                            typographyStyle="body-sm"
                            align="center"
                            ellipsisLineCount={2}
                            margin={{ horizontal: 8 }}
                            data-testid="@guide/label"
                            width="100%"
                        >
                            {label}
                        </Paragraph>
                    )}
                </>
            )}
            {!back && label && (
                <H3 flex="1" ellipsisLineCount={1} margin={{ right: 8 }}>
                    {label}
                </H3>
            )}

            <IconButton
                icon={XIcon}
                intent="neutral"
                priority="secondary"
                onClick={handleClose}
                data-testid="@guide/button-close"
                tooltip={{ content: <Translation id="TR_CLOSE" /> }}
            />
        </HeaderWrapper>
    );
};
