import { AnimatePresence, motion } from 'framer-motion';
import styled from 'styled-components';

import { motionEasing } from '@trezor/components';

import { CaptionLines } from './CaptionLines';
import { CAPTION_COPY, type CaptionId } from '../discoveryCopy';

// Every caption is laid out invisibly in the same grid cell as the shown one, so the cell is as
// tall as the longest caption at this width and in this language. The card keeps its height from
// before the first caption until the end, whichever caption wraps to more lines. Hidden copies are
// also out of the accessibility tree.
const CaptionCell = styled.div`
    display: grid;
    width: 100%;
    max-width: 470px;
    margin-top: 20px;

    > * {
        grid-area: 1 / 1;
    }
`;

const CaptionSizer = styled.div`
    visibility: hidden;
`;

type DiscoveryCaptionProps = {
    caption: CaptionId | null;
};

/**
 * One caption at a time: the old one fades out before the new one fades in, so there is never
 * an outdated text on screen (or in the accessibility tree).
 */
export const DiscoveryCaption = ({ caption }: DiscoveryCaptionProps) => (
    <CaptionCell>
        {Object.entries(CAPTION_COPY).map(([captionId, { lead, detail }]) => (
            <CaptionSizer key={captionId}>
                <CaptionLines lead={lead} detail={detail} />
            </CaptionSizer>
        ))}
        <AnimatePresence mode="wait" initial={false}>
            {caption !== null && (
                <motion.div
                    key={caption}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{
                        opacity: 1,
                        y: 0,
                        transition: { duration: 0.26, ease: motionEasing.enter },
                    }}
                    exit={{ opacity: 0, transition: { duration: 0.16, ease: motionEasing.exit } }}
                >
                    <CaptionLines
                        lead={CAPTION_COPY[caption].lead}
                        detail={CAPTION_COPY[caption].detail}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    </CaptionCell>
);
