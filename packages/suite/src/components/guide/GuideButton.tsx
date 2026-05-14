import { FreeFocusInside } from 'react-focus-lock';

import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { IconButton, TOOLTIP_DELAY_LONG, Tooltip } from '@trezor/components';
import { zIndices } from '@trezor/theme';
import { hexToRgba } from '@trezor/utils';

import { useGuide } from 'src/hooks/guide';

const Wrapper = styled.div<{ $isGuideOpen: boolean }>`
    position: fixed;
    z-index: ${zIndices.guideButton};
    bottom: 15px;
    right: 15px;
    border-radius: 12px;
    backdrop-filter: blur(10px);
    transition: ${({ $isGuideOpen }) => ($isGuideOpen ? 'none' : 'all 0.3s ease 0.3s')};
    opacity: ${({ $isGuideOpen }) => ($isGuideOpen ? '0' : '1')};
    background: ${({ theme }) => hexToRgba(theme.surfaceFillModeless, 0.7)};
`;

export const GuideButton = () => {
    const { openGuide, isGuideOpen } = useGuide();

    return (
        <FreeFocusInside>
            <Wrapper $isGuideOpen={isGuideOpen}>
                <Tooltip
                    content={<Translation id="TR_GUIDE_SUPPORT_AND_FEEDBACK" />}
                    placement="top"
                    delayShow={TOOLTIP_DELAY_LONG}
                >
                    <IconButton
                        data-testid="@guide/button-open"
                        onClick={openGuide}
                        icon="lifebuoy"
                        intent="neutral"
                        priority="secondary"
                        size="large"
                    />
                </Tooltip>
            </Wrapper>
        </FreeFocusInside>
    );
};
