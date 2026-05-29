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
    descriptionTrigger: 'User selects a labeling provider (Dropbox, Google Drive, file system, etc.) in Settings or closes the provider selection modal',
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
            description: 'The selected labeling provider: `dropbox` for Dropbox, `google` for Google Drive, `fileSystem` for local file system, `evolu` for Evolu, `legacy` for legacy provider, `missing-provider` when labeling is enabled but no provider is configured, or empty string when provider is not selected',
        },
    },
};
