import { useEffect, useState } from 'react';

import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { Paragraph, Text } from '@trezor/components';

import { getDiscoveryCaptions } from './getDiscoveryCaptions';
import { type DiscoveryStage } from './useDiscoveryIllustration';

// All captions of the rotation share one grid cell, so the tallest sets the height in any
// language and width, and the card doesn't jump when they rotate.
const CaptionCell = styled.div`
    display: grid;
    max-width: 470px;
    margin-top: 24px;

    > * {
        grid-area: 1 / 1;
    }
`;

// Hidden captions only hold the space. The next one fades in as the previous one goes.
const CaptionSlot = styled.div<{ $isShown: boolean }>`
    visibility: ${({ $isShown }) => ($isShown ? 'visible' : 'hidden')};
    opacity: ${({ $isShown }) => ($isShown ? 1 : 0)};
    transition: opacity 0.26s;
`;

const ROTATION_INTERVAL_MS = 7500;

type DiscoveryCaptionProps = {
    stage: DiscoveryStage;
    isReducedMotion: boolean;
};

export const DiscoveryCaption = ({ stage, isReducedMotion }: DiscoveryCaptionProps) => {
    const [rotation, setRotation] = useState(0);

    useEffect(() => {
        if (isReducedMotion) return;

        const interval = setInterval(() => setRotation(index => index + 1), ROTATION_INTERVAL_MS);

        return () => clearInterval(interval);
    }, [isReducedMotion]);

    const captions = getDiscoveryCaptions(stage, isReducedMotion);
    const [otherStageFirstCaption] = getDiscoveryCaptions(
        stage === 'block' ? 'mempool' : 'block',
        isReducedMotion,
    );
    const shownIndex = rotation % captions.length;

    // The illustration's label reads all captions once, so the rotation is only for the eye. The
    // other stage's first caption holds its space too, so the card keeps its height at the switch.
    return (
        <CaptionCell aria-hidden="true">
            {[...captions, otherStageFirstCaption].map(([lead, ...lines], index) => (
                // The still's caption mounts as a new node, so switching to it never fades.
                <CaptionSlot key={`${isReducedMotion}-${lead}`} $isShown={index === shownIndex}>
                    <Paragraph
                        typographyStyle="body-sm"
                        color="contentSecondary"
                        align="center"
                        textWrap="balance"
                    >
                        <Text typographyStyle="body-sm-strong" color="contentPrimary">
                            <Translation id={lead} />
                        </Text>
                        <br />
                        {lines.flatMap(line => [' ', <Translation key={line} id={line} />])}
                    </Paragraph>
                </CaptionSlot>
            ))}
        </CaptionCell>
    );
};
