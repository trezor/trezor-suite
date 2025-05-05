import { FreeFocusInside } from 'react-focus-lock';

import { AnimatePresence, motion } from 'framer-motion';

import { ActiveView } from '@suite-common/suite-types';
import { Box, Modal, useMediaQuery, variables } from '@trezor/components';
import { useOnce } from '@trezor/react-utils';
import { borders, spacings, zIndices } from '@trezor/theme';
import { exhaustive } from '@trezor/type-utils';

import {
    Feedback,
    Guide,
    GuideArticle,
    GuideCategory,
    SupportFeedbackSelection,
} from 'src/components/guide';
import { GUIDE_ANIMATION_DURATION_MS, useGuide } from 'src/hooks/guide';
import { useSelector } from 'src/hooks/suite';

const getGuideContent = (activeView: ActiveView) => {
    switch (activeView) {
        case 'GUIDE_ARTICLE':
            return <GuideArticle />;
        case 'GUIDE_CATEGORY':
            return <GuideCategory />;
        case 'SUPPORT_FEEDBACK_SELECTION':
            return <SupportFeedbackSelection />;
        case 'FEEDBACK_BUG':
            return <Feedback type="BUG" />;
        case 'FEEDBACK_SUGGESTION':
            return <Feedback type="SUGGESTION" />;
        case 'GUIDE_DEFAULT':
            return <Guide />;
        default:
            exhaustive(activeView);
    }
};

export const GuideRouter = () => {
    const activeView = useSelector(state => state.guide.view);
    const { isGuideOpen, closeGuide } = useGuide();
    const isBelowLaptop = useMediaQuery(`(max-width: ${variables.SCREEN_SIZE.LG})`);

    // if guide is open, do not animate guide opening if transitioning between onboarding, welcome and suite layout
    const isFirstRender = useOnce(isGuideOpen, false);

    const content = (
        <motion.div
            data-testid="@guide/panel"
            initial={{
                width: isFirstRender ? variables.LAYOUT_SIZE.GUIDE_PANEL_WIDTH : 0,
            }}
            animate={{
                width: variables.LAYOUT_SIZE.GUIDE_PANEL_WIDTH,
                transition: {
                    duration: GUIDE_ANIMATION_DURATION_MS / 1000,
                    bounce: 0,
                },
            }}
            exit={{
                width: 0,
                transition: {
                    duration: GUIDE_ANIMATION_DURATION_MS / 1000,
                    bounce: 0,
                },
            }}
        >
            <Box
                height="100vh"
                maxWidth="100vw"
                overflow="hidden auto"
                borderWidth={{ left: borders.widths.small }}
            >
                {activeView && getGuideContent(activeView)}
            </Box>
        </motion.div>
    );

    return (
        <AnimatePresence>
            {isGuideOpen &&
                (isBelowLaptop ? (
                    <Modal.Backdrop
                        alignment={{ x: 'end', y: 'center' }}
                        padding={spacings.zero}
                        onClick={closeGuide}
                        zIndex={zIndices.guide}
                    >
                        {content}
                    </Modal.Backdrop>
                ) : (
                    <FreeFocusInside>{content}</FreeFocusInside>
                ))}
        </AnimatePresence>
    );
};
