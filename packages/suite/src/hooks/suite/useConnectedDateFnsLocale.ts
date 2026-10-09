import { useSelector } from 'react-redux';

import { useDateFnsLocale } from '@suite/intl';
import { selectLanguage } from '@suite/settings';

export const useConnectedDateFnsLocale = () => {
    const locale = useSelector(selectLanguage);

    return useDateFnsLocale(locale);
};
