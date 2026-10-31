import { useRef } from 'react';

import styled, { useTheme } from 'styled-components';

import { Translation, useTranslation } from '@suite/intl';
import { selectLanguage } from '@suite/settings';
import { Card, Column, H3, LottieAnimation, ProgressBar, useMediaQuery } from '@trezor/components';
import { typography, typographyStylesBase } from '@trezor/theme';
import { localizeNumber } from '@trezor/utils';

import { useCoinjoinAccountLoadingProgress } from 'src/hooks/coinjoin';
import { useSelector } from 'src/hooks/suite';

import { DiscoveryCaption } from './DiscoveryCaption/DiscoveryCaption';
import { DiscoveryLegend } from './DiscoveryLegend/DiscoveryLegend';
import {
    PrivacyIllustration,
    type PrivacyIllustrationHandle,
} from './PrivacyIllustration/PrivacyIllustration';
import { useDiscoveryCaptions } from './useDiscoveryCaptions';

// Reserves the message line so the layout doesn't jump when the first progress message arrives.
const Subheader = styled.div`
    display: flex;
    align-items: center;
    color: ${({ theme }) => theme.contentSecondary};
    ${typography['body-sm']}
    text-align: center;
    margin-top: 6px;
    min-height: ${typographyStylesBase['body-sm'].lineHeight}px;
`;

const DiscoveryProgressWrapper = styled.div`
    width: 100%;
    max-width: 440px;
    margin-top: 16px;
`;

const LottieWrapper = styled.div`
    margin: -32px -8px -32px -20px;

    path {
        stroke: ${({ theme }) => theme.contentSecondary};
        fill: ${({ theme }) => theme.surfaceFillRaised};
    }
`;

// Live, unlike framer-motion's useReducedMotion, which reads the setting once: discovery runs for
// minutes, so a change of the system setting applies right away.
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

export const DiscoveryProgressCard = () => {
    const locale = useSelector(selectLanguage);
    const theme = useTheme();
    const { translationString } = useTranslation();
    const isReducedMotion = useMediaQuery(REDUCED_MOTION_QUERY);
    const illustrationRef = useRef<PrivacyIllustrationHandle>(null);
    const { messageId, outOf, progress, stage } = useCoinjoinAccountLoadingProgress(info =>
        illustrationRef.current?.handleScanEvent(info),
    );
    const { caption, onBeat } = useDiscoveryCaptions(stage, !isReducedMotion);
    const messageValues = outOf && {
        current: localizeNumber(outOf.current, locale),
        total: localizeNumber(outOf.total, locale),
    };

    return (
        <Card margin={{ bottom: 24 }}>
            <Column alignItems="center" margin={{ top: 4, bottom: 16 }}>
                <PrivacyIllustration
                    ref={illustrationRef}
                    stage={stage ?? 'block'}
                    isReducedMotion={isReducedMotion}
                    onBeat={onBeat}
                />
                <H3 margin={{ top: 6 }}>
                    <Translation id="TR_COINJOIN_DISCOVERY_TITLE" />
                </H3>
                <Subheader>
                    <LottieWrapper>
                        <LottieAnimation
                            type={stage === 'mempool' ? 'MEMPOOL' : 'BLOCK'}
                            size={64}
                            loop={!isReducedMotion}
                            autoplay={!isReducedMotion}
                        />
                    </LottieWrapper>
                    {messageId && <Translation id={messageId} values={messageValues} />}
                </Subheader>

                <DiscoveryProgressWrapper
                    role="progressbar"
                    aria-label={translationString('TR_COINJOIN_DISCOVERY_TITLE')}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(progress * 100)}
                >
                    <ProgressBar
                        max={1.01}
                        value={progress}
                        backgroundColor={theme.elementFillNeutralSoft}
                    />
                </DiscoveryProgressWrapper>

                {isReducedMotion ? (
                    <DiscoveryLegend stage={stage ?? 'block'} />
                ) : (
                    <DiscoveryCaption caption={caption} />
                )}
            </Column>
        </Card>
    );
};
