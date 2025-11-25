// IMPORTANT! This package is just temporary solution until https://github.com/trezor/trezor-suite/pull/5647 will be merged.
// Then we won't need this package anymore and can be deleted.
import { ComponentProps } from 'react';
import { FormattedMessage } from 'react-intl';

// Warning, very hacky import solution, do not use this anywhere else than in this file.
import type { TranslationKey as SuiteTranslationKey } from '../../../packages/suite/src/components/suite/Translation';

// reexport for easier usage, without need to have hacky solutions
export type TranslationKey = SuiteTranslationKey;

// Add values to MessageDescriptor type, types are copied from react-intl because they are not exported from the package.
export type ExtendedMessageDescriptor = Pick<
    ComponentProps<typeof FormattedMessage>,
    'defaultMessage' | 'values'
> & {
    id: TranslationKey;
};
