import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    provider: AttributeDef<
        | 'dropbox'
        | 'google'
        | 'fileSystem'
        | 'missing-provider'
        | 'inMemoryTest'
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
    descriptionTrigger:
        'User selects a labeling provider (Dropbox, Google Drive, file system, Suite-sync, etc.) in Settings or closes the provider selection modal',
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
            changelog: [{ version: '1.21.0', notes: 'added' }],
            description: `The selected labeling provider:
- \`dropbox\`: Dropbox
- \`google\`: Google Drive
- \`fileSystem\`: local file system
- \`evolu\`: Suite Sync (Evolu-backed)
- \`legacy\`: legacy provider
- \`missing-provider\`: labeling is enabled but no provider is configured`,
        },
    },
};
