import { useSelector, useActions, useLayoutSize } from '@suite-hooks';
import { MODAL } from '@suite-actions/constants';
import * as guideActions from '@suite-actions/guideActions';

export const useGuide = () => {
    const { isMobileLayout } = useLayoutSize();

    const { guideOpen, isModalOpen } = useSelector(state => ({
        guideOpen: !isMobileLayout && state.guide.open,
        // 2 types of modals exist. 1. redux 'modal' based, 2. redux 'router' based
        isModalOpen:
            !state.router.route?.isFullscreenApp &&
            (state.router.route?.isForegroundApp || state.modal.context !== MODAL.CONTEXT_NONE),
    }));

    const { openGuide, closeGuide } = useActions({
        openGuide: guideActions.open,
        closeGuide: guideActions.close,
    });

    return {
        guideOpen,
        isModalOpen,
        openGuide,
        closeGuide,
    };
};
