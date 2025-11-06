import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { selectUserSelectedLocaleTag } from '../localeSlice';
import { useSystemLocaleTag } from './useSystemLocaleTag';

export const useLocale = () => {
    const userSelectedLocaleTag = useSelector(selectUserSelectedLocaleTag);
    const systemLocaleTag = useSystemLocaleTag();

    const locale = useMemo(
        () => (userSelectedLocaleTag === 'system' ? systemLocaleTag : userSelectedLocaleTag),
        [userSelectedLocaleTag, systemLocaleTag],
    );

    return locale;
};
