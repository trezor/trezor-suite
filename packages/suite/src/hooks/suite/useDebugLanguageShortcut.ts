import { useCallback, useEffect } from 'react';

import {
    selectAutodetectLanguage,
    selectIsDebugModeActive,
    selectLanguage,
    selectShowTranslationKeys,
    suiteSettingsActions,
} from '@suite/settings';
import { LANGUAGES, type Locale } from '@suite-common/suite-types';
import { KEYBOARD_CODE } from '@trezor/components';

import { useDispatch } from './useDispatch';
import { useSelector } from './useSelector';

const languages: { value: Locale; label: string }[] = Object.entries(LANGUAGES)
    .filter(lang => ['official', 'community'].includes(lang[1].type || ''))
    .map(([value, { name }]) => ({ value: value as Locale, label: name }));

export const useDebugLanguageShortcut = () => {
    const dispatch = useDispatch();

    const isDebug = useSelector(selectIsDebugModeActive);
    const language = useSelector(selectLanguage);
    const isLanguageAutodetect = useSelector(selectAutodetectLanguage);
    const showTranslationKeys = useSelector(selectShowTranslationKeys);

    const onLanguageKeys = useCallback(
        (event: KeyboardEvent) => {
            const currentIndex = languages.findIndex(lang => lang.value === language);

            if (event.ctrlKey && event.key === KEYBOARD_CODE.FUNCTION_KEY_NINE) {
                const nextIndex = (currentIndex + 1) % languages.length;

                if (isLanguageAutodetect) {
                    dispatch(suiteSettingsActions.setAutodetect({ language: false }));
                }
                dispatch(suiteSettingsActions.setLanguage(languages[nextIndex].value || 'en'));
            }

            if (event.ctrlKey && event.key === KEYBOARD_CODE.FUNCTION_KEY_SEVEN) {
                const nextIndex = (currentIndex - 1 + languages.length) % languages.length;
                if (isLanguageAutodetect) {
                    dispatch(suiteSettingsActions.setAutodetect({ language: false }));
                }
                dispatch(suiteSettingsActions.setLanguage(languages[nextIndex].value));
            }

            const isToggleTranslationKeys =
                event.ctrlKey &&
                (event.key === KEYBOARD_CODE.FUNCTION_KEY_TWELVE ||
                    event.code === KEYBOARD_CODE.FUNCTION_KEY_TWELVE);

            if (isToggleTranslationKeys) {
                event.preventDefault();
                dispatch(
                    suiteSettingsActions.setDebugMode({
                        showTranslationKeys: !showTranslationKeys,
                    }),
                );
            }
        },
        [language, dispatch, isLanguageAutodetect, showTranslationKeys],
    );

    useEffect(() => {
        // removeEventListener method will do nothing if the specified listener does not exist on the target element
        if (isDebug) {
            document.addEventListener('keydown', onLanguageKeys);
        } else {
            document.removeEventListener('keydown', onLanguageKeys);
        }

        return () => {
            document.removeEventListener('keydown', onLanguageKeys);
        };
    }, [onLanguageKeys, isDebug]);
};
