import { useCallback, useEffect } from 'react';

import { KEYBOARD_CODE } from '@trezor/components';
import { useGuide } from 'src/hooks/guide';

export const useGuideKeyboard = () => {
    const { openGuide, closeGuide, isGuideOpen, isModalOpen } = useGuide();

    const onGuideKeys = useCallback(
        (event: KeyboardEvent) => {
            if (event.key === KEYBOARD_CODE.ESCAPE) {
                if (isModalOpen) return;
                if (isGuideOpen) {
                    closeGuide();
                }
            }

            if (event.key === KEYBOARD_CODE.FUNCTION_KEY_ONE) {
                if (!isGuideOpen) openGuide();
                else closeGuide();
                event.preventDefault();
            }
        },
        [isGuideOpen, isModalOpen, closeGuide, openGuide],
    );

    useEffect(() => {
        document.addEventListener('keydown', onGuideKeys);

        return () => {
            document.removeEventListener('keydown', onGuideKeys);
        };
    }, [onGuideKeys]);
};
