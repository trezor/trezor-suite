import { memo, useEffect, useMemo, useRef } from 'react';
import { FreeFocusInside } from 'react-focus-lock';

import type { LottieRef } from 'lottie-react';
import styled, { useTheme } from 'styled-components';

import { Translation, useTranslation } from '@suite/intl';
import {
    LottieAnimation,
    Row,
    ShortcutBadge,
    TOOLTIP_DELAY_LONG,
    Tooltip,
    commonFocusStyles,
} from '@trezor/components';
import { zIndices } from '@trezor/theme';

import { useGuide } from 'src/hooks/guide';

const MASCOT_SOURCE_COLOR = '#1E5736';

const MASCOT_SIZE = 32;

// Session-scoped guard: the intro animation should play only once, on app load. Hovering replays the animation.
const mascotIntro = { hasPlayed: false };

const Wrapper = styled.div<{ $isGuideOpen: boolean }>`
    position: fixed;
    z-index: ${zIndices.guideButton};
    bottom: 16px;
    right: 16px;
    border-radius: 12px;
    backdrop-filter: blur(10px);
    transition: ${({ $isGuideOpen }) => ($isGuideOpen ? 'none' : 'all 0.3s ease 0.3s')};
    opacity: ${({ $isGuideOpen }) => ($isGuideOpen ? '0' : '1')};
`;

const MascotButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    padding: 0;
    border: 0;
    border-radius: 12px;
    cursor: pointer;
    overflow: hidden;
    -webkit-app-region: no-drag;
    background: ${({ theme }) => theme.elementFillNeutralSoft};
    transition: 0.1s ease-in-out;

    &:hover {
        background: ${({ theme }) => theme.elementFillNeutralSoftHovered};
    }

    &:active {
        background: ${({ theme }) => theme.elementFillNeutralSoftPressed};
        transform: scale(0.95);
    }

    &:focus-visible {
        ${commonFocusStyles}
    }
`;

export const GuideButton = memo(function GuideButton() {
    const { openGuide, isGuideOpen } = useGuide();
    const { translationString } = useTranslation();
    const theme = useTheme();
    const lottieRef: LottieRef = useRef(null);

    const shouldAutoplayIntro = !mascotIntro.hasPlayed;

    useEffect(() => {
        mascotIntro.hasPlayed = true;
    }, []);

    const colorReplacements = useMemo(
        () => [{ from: MASCOT_SOURCE_COLOR, to: theme.contentPrimary }],
        [theme.contentPrimary],
    );

    const handleMouseEnter = () => {
        lottieRef.current?.goToAndPlay(0, true);
    };

    return (
        <FreeFocusInside>
            <Wrapper $isGuideOpen={isGuideOpen}>
                <Tooltip
                    content={
                        <Row gap={8}>
                            <Translation id="TR_GUIDE_SUPPORT_AND_FEEDBACK" />
                            <ShortcutBadge shortcut={['F1']} isInverse />
                        </Row>
                    }
                    placement="top"
                    delayShow={TOOLTIP_DELAY_LONG}
                >
                    <MascotButton
                        type="button"
                        data-testid="@guide/button-open"
                        onClick={openGuide}
                        onMouseEnter={handleMouseEnter}
                        aria-label={translationString('TR_GUIDE_SUPPORT_AND_FEEDBACK')}
                    >
                        <LottieAnimation
                            type="MASCOT"
                            size={MASCOT_SIZE}
                            loop={false}
                            autoplay={shouldAutoplayIntro}
                            lottieRef={lottieRef}
                            colorReplacements={colorReplacements}
                        />
                    </MascotButton>
                </Tooltip>
            </Wrapper>
        </FreeFocusInside>
    );
});
