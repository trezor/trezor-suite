import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    provider: AttributeDef<
        | 'dropbox'
        | 'google'
        | 'fileSystem'
        | 'missing-provider'
        | 'inMemoryTest'
        | 'closed'
        | 'evolu'
        | 'legacy'
        | ''
    >;
};

export const settingsGeneralLabelingProviderEvent: EventDef<
    Attributes,
    EventType.SettingsGeneralLabelingProvider
> = {
    name: EventType.SettingsGeneralLabelingProvider,
    descriptionTrigger: 'when user select some provider, or when close the modal',
    changelog: [
        { version: '1.21.0', notes: 'added' },
        {
            version: '1.22.0',
            notes: 'Added `missing-provider`, which is reported if labeling is enabled, but no provider is set.',
        },
        { version: '25.4.1', notes: 'updated' },
    ],

    attributes: {
        provider: {
            changelog: [{ version: '?', notes: 'added' }],
        },
    },
};
