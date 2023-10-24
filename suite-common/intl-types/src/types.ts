// IMPORTANT! This package is just temporary solution until https://github.com/trezor/trezor-suite/pull/5647 will be merged.
// Then we won't need this package anymore and can be deleted.
import { ReactElement } from 'react';
import { MessageDescriptor } from 'react-intl';

import { PrimitiveType } from '@trezor/type-utils';

// Warning, very hacky import solution, do not use this anywhere else than in this file.
import type { TranslationKey as SuiteTranslationKey } from '../../../packages/suite/src/components/suite/Translation';

// reexport for easier usage, without need to have hacky solutions
export type TranslationKey = SuiteTranslationKey;

// Add MessageDescriptor type to values entry
export type FormatXMLElementFn = (...args: any[]) => string | object;
export interface ExtendedMessageDescriptor extends MessageDescriptor {
    id: TranslationKey;
    values?: {
        [key: string]:
            | PrimitiveType
            | ReactElement
            | ExtendedMessageDescriptor
            | FormatXMLElementFn;
    };
}
