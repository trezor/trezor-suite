import { FormattedMessage } from 'react-intl';
import { useSelector } from 'react-redux';

import { selectAreDebugTranslationKeysDisplayed } from './localeSlice';
import { type TxKeyPath } from './types';

type TranslationProps = Omit<React.ComponentProps<typeof FormattedMessage>, 'defaultMessage'> & {
    id: TxKeyPath;
};

export const Translation = ({ id, ...props }: TranslationProps) => {
    const areDebugTranslationKeysDisplayed = useSelector(selectAreDebugTranslationKeysDisplayed);

    if (areDebugTranslationKeysDisplayed) {
        return id;
    }

    return <FormattedMessage id={id} {...props} />;
};
