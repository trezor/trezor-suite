import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { NATIVE_LANGUAGES, NativeLocale } from '@suite-common/suite-types';
import { Select, SelectItemType } from '@suite-native/atoms';
import { selectLanguage, setLanguage } from '@suite-native/intl';

const languageItems = Object.entries(NATIVE_LANGUAGES).map(
    ([localeCode, language]) =>
        ({
            value: localeCode,
            label: language.name,
        }) as SelectItemType<NativeLocale | 'system'>,
);

languageItems.unshift({
    value: 'system',
    label: 'System',
});

export const LanguageSelect = () => {
    const language = useSelector(selectLanguage);
    const dispatch = useDispatch();

    const handleSelectLanguage = (localeCode: NativeLocale | 'system') => {
        dispatch(setLanguage(localeCode));
    };

    return (
        <Select
            items={languageItems}
            selectLabel="Language"
            selectValue={language}
            onSelectItem={handleSelectLanguage}
        />
    );
};
