import { useCallback, useEffect } from 'react';

import { MODAL } from '@suite-actions/constants';
import { KEYBOARD_CODE } from '@trezor/components';
import * as guideActions from '@suite-actions/guideActions';
import { useSelector, useActions } from '@suite-hooks';

export const useGuideKeyboard = () => {
    const { guideOpen, isModalOpen } = useSelector(state => ({
        guideOpen: state.guide.open,
        // 2 types of modals exist. 1. redux 'modal' based, 2. redux 'router' based
        isModalOpen:
            state.modal.context !== MODAL.CONTEXT_NONE || state.router.route?.isForegroundApp,
    }));
    const { openGuide, closeGuide } = useActions({
        openGuide: guideActions.open,
        closeGuide: guideActions.close,
    });

    const onGuideKeys = useCallback(
        (event: KeyboardEvent) => {
            if (event.key === KEYBOARD_CODE.ESCAPE) {
                if (isModalOpen) return;
                if (guideOpen) {
                    closeGuide();
                }
            }

            if (event.key === KEYBOARD_CODE.FUNCTION_KEY_ONE) {
                if (!guideOpen) openGuide();
                else closeGuide();
            }
        },
        [guideOpen, isModalOpen, closeGuide, openGuide],
    );

    useEffect(() => {
        document.addEventListener('keydown', onGuideKeys);
        return () => {
            document.removeEventListener('keydown', onGuideKeys);
        };
    }, [onGuideKeys]);
};
