import { useCallback, useEffect } from 'react';

import { KEYBOARD_CODE } from '@trezor/components';
import { useGuide } from '@guide-hooks';

export const useGuideKeyboard = () => {
    const { openGuide, closeGuide, guideOpen, isModalOpen } = useGuide();

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
                event.preventDefault();
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
