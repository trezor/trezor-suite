import { useCallback, useState } from 'react';
import { FreeFocusInside } from 'react-focus-lock';

import { AnimatePresence, motion } from 'framer-motion';

import { type ActiveView } from '@suite-common/suite-types';
import { Box, Modal, ResizableBox, variables } from '@trezor/components';
import { useOnce } from '@trezor/react-utils';
import { borders, spacings, zIndices } from '@trezor/theme';
import { exhaustive } from '@trezor/type-utils';

import { setWidth as setGuideWidth } from 'src/actions/suite/guideActions';
import {
    Feedback,
    Guide,
    GuideArticle,
    GuideCategory,
    SupportFeedbackSelection,
} from 'src/components/guide';
import { MIN_CONTENT_WIDTH } from 'src/constants/suite/layout';
import { GUIDE_ANIMATION_DURATION_MS, useGuide } from 'src/hooks/guide';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useResponsiveContext } from 'src/support/suite/ResponsiveContext';

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
    const storedWidth = useSelector(state => state.guide.width);
    const { isGuideOpen, closeGuide, isGuideOnTop } = useGuide();
    const { contentWidth } = useResponsiveContext();
    const dispatch = useDispatch();

    const [width, setWidth] = useState(storedWidth);
    const [isResizing, setIsResizing] = useState(false);
    const [maxResizableGuideWidth, setMaxResizableGuideWidth] = useState<number>(
        variables.LAYOUT_SIZE.GUIDE_PANEL_MAX_WIDTH,
    );

    // if guide is open, do not animate guide opening if transitioning between onboarding, welcome and suite layout
    const isFirstRender = useOnce(isGuideOpen, false);

    const handleResizeMove = useCallback((nextWidth: number) => {
        setWidth(nextWidth);
    }, []);

    const handleResizeEnd = useCallback(
        (nextWidth: number) => {
            dispatch(setGuideWidth(nextWidth));
        },
        [dispatch],
    );

    const content = (
        <motion.div
            data-testid="@guide/panel"
            style={{ overflow: 'hidden' }}
            initial={{
                width: isFirstRender ? width : 0,
            }}
            animate={{
                width,
                transition: {
                    duration: isResizing ? 0 : GUIDE_ANIMATION_DURATION_MS / 1000,
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
            <ResizableBox
                directions={['left']}
                width={width}
                forcedWidth={width}
                minWidth={variables.LAYOUT_SIZE.GUIDE_PANEL_MIN_WIDTH}
                maxWidth={maxResizableGuideWidth}
                onResizeStart={() => {
                    setIsResizing(true);
                    // Cap growth so contentWidth can't shrink below MIN_CONTENT_WIDTH.
                    // Captured at gesture start to stay stable despite ResizeObserver debounce lag.
                    const limit =
                        contentWidth != null
                            ? width + contentWidth - MIN_CONTENT_WIDTH
                            : variables.LAYOUT_SIZE.GUIDE_PANEL_MAX_WIDTH;
                    setMaxResizableGuideWidth(
                        Math.min(
                            variables.LAYOUT_SIZE.GUIDE_PANEL_MAX_WIDTH,
                            Math.max(width, limit),
                        ),
                    );
                }}
                onResizeStop={() => {
                    setIsResizing(false);
                    setMaxResizableGuideWidth(variables.LAYOUT_SIZE.GUIDE_PANEL_MAX_WIDTH);
                }}
                onWidthResizeMove={handleResizeMove}
                onWidthResizeEnd={handleResizeEnd}
            >
                <Box
                    height="100vh"
                    maxWidth="100vw"
                    overflow="hidden auto"
                    borderWidth={{ left: borders.widths.small }}
                >
                    {activeView && getGuideContent(activeView)}
                </Box>
            </ResizableBox>
        </motion.div>
    );

    return (
        <AnimatePresence>
            {isGuideOpen &&
                (isGuideOnTop ? (
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
