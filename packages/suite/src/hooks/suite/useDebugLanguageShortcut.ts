import { useCallback, useEffect } from 'react';

import { KEYBOARD_CODE } from '@trezor/components';
import { useSelector } from './useSelector';
import { useDispatch } from './useDispatch';
import { setLanguage } from 'src/actions/settings/languageActions';
import LANGUAGES, { Locale } from 'src/config/suite/languages';
import { setAutodetect } from 'src/actions/suite/suiteActions';
import { selectIsDebugModeActive, selectLanguage } from 'src/reducers/suite/suiteReducer';

const languages: { value: Locale; label: string }[] = Object.entries(LANGUAGES)
    .filter(lang => ['official', 'community'].includes(lang[1].type || ''))
    .map(([value, { name }]) => ({ value: value as Locale, label: name }));

export const useDebugLanguageShortcut = () => {
    const dispatch = useDispatch();

    const isDebug = useSelector(selectIsDebugModeActive);
    const language = useSelector(selectLanguage);
    const isLanguageAutodetect = useSelector(state => state.suite.settings.autodetect.language);

    const onLanguageKeys = useCallback(
        (event: KeyboardEvent) => {
            const currentIndex = languages.findIndex(lang => lang.value === language);

            if (event.ctrlKey && event.key === KEYBOARD_CODE.FUNCTION_KEY_NINE) {
                const nextIndex = (currentIndex + 1) % languages.length;

                if (isLanguageAutodetect) {
                    dispatch(setAutodetect({ language: false }));
                }
                dispatch(setLanguage(languages[nextIndex].value || 'en'));
            }

            if (event.ctrlKey && event.key === KEYBOARD_CODE.FUNCTION_KEY_SEVEN) {
                const nextIndex = (currentIndex - 1 + languages.length) % languages.length;
                if (isLanguageAutodetect) {
                    dispatch(setAutodetect({ language: false }));
                }
                dispatch(setLanguage(languages[nextIndex].value));
            }
        },
        [language, dispatch, isLanguageAutodetect],
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
