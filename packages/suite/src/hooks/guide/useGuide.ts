import { useMemo } from 'react';
import { useSelector, useActions, useLayoutSize } from '@suite-hooks';
import { MODAL } from '@suite-actions/constants';
import * as guideActions from '@suite-actions/guideActions';

export const GUIDE_ANIMATION_DURATION_MS = 300;

export const useGuide = () => {
    const { isGuideOpen, isModalOpen } = useSelector(state => ({
        isGuideOpen: state.guide.open,
        // 2 types of modals exist. 1. redux 'modal' based, 2. redux 'router' based
        isModalOpen:
            !state.router.route?.isFullscreenApp &&
            (state.router.route?.isForegroundApp || state.modal.context !== MODAL.CONTEXT_NONE),
    }));

    const { layoutSize } = useLayoutSize();

    const { openGuide, closeGuide } = useActions({
        openGuide: guideActions.open,
        closeGuide: guideActions.close,
    });

    const isGuideOnTop = useMemo(
        () => ['NORMAL', 'SMALL', 'TINY'].includes(layoutSize),
        [layoutSize],
    );

    return {
        isGuideOpen,
        isGuideOnTop,
        isModalOpen,
        openGuide,
        closeGuide,
    };
};
