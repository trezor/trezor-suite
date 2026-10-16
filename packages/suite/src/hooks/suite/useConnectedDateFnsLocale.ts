import { useSelector } from 'react-redux';

import { selectLanguage } from '@suite/settings';
import { useDateFnsLocale } from '@suite-lego/intl';

export const useConnectedDateFnsLocale = () => {
    const locale = useSelector(selectLanguage);

    return useDateFnsLocale(locale);
};
