import { useSelector, useActions, useLayoutSize } from '@suite-hooks';
import { MODAL } from '@suite-actions/constants';
import * as guideActions from '@suite-actions/guideActions';
import { useEffect, useState } from 'react';

export const GUIDE_ANIMATION_DURATION_MS = 300;

export const useGuide = () => {
    const { guideOpen, isModalOpen } = useSelector(state => ({
        guideOpen: state.guide.open,
        // 2 types of modals exist. 1. redux 'modal' based, 2. redux 'router' based
        isModalOpen:
            !state.router.route?.isFullscreenApp &&
            (state.router.route?.isForegroundApp || state.modal.context !== MODAL.CONTEXT_NONE),
    }));

    const [hasAnimationFinished, setHasAnimationFinished] = useState(false);

    const { layoutSize } = useLayoutSize();

    const { openGuide, closeGuide } = useActions({
        openGuide: guideActions.open,
        closeGuide: guideActions.close,
    });

    useEffect(() => {
        const timeout = setTimeout(
            () => setHasAnimationFinished(current => !current),
            GUIDE_ANIMATION_DURATION_MS,
        );

        return () => clearTimeout(timeout);
    }, [guideOpen]);

    const isGuideOnTop = ['NORMAL', 'SMALL', 'TINY'].includes(layoutSize);

    return {
        guideOpen,
        hasAnimationFinished,
        isGuideOnTop,
        isModalOpen,
        openGuide,
        closeGuide,
    };
};
