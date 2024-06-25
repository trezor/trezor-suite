import { FormattedMessage } from 'react-intl';

import type { Messages } from '../translations/default';

export const Translation = ({ id, values }: { id: keyof Messages; values?: any }) => <FormattedMessage id={id} tagName="span" values={values} />;
