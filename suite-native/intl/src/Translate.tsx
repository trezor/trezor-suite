import { FormattedMessage } from 'react-intl';

import { TxKeyPath } from './types';

type TranslationProps = Omit<React.ComponentProps<typeof FormattedMessage>, 'defaultMessage'> & {
    id: TxKeyPath;
};

export const Translation = (props: TranslationProps) => <FormattedMessage {...props} />;
