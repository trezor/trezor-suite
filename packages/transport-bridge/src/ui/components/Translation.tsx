import { type ComponentProps } from 'react';
import { FormattedMessage } from 'react-intl';

import type { Messages } from '../translations/default';

type TranslationValues = ComponentProps<typeof FormattedMessage>['values'];

export const Translation = ({ id, values }: { id: keyof Messages; values?: TranslationValues }) => (
    <FormattedMessage id={id} tagName="span" values={values} />
);
