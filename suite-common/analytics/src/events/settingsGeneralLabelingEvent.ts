import { EventType } from '../constants';
import type { AttributeDef, EventDef } from '../eventDefinition';

type Attributes = {
    value: AttributeDef<'off' | 'legacy' | 'suite-sync'>;
};

export const settingsGeneralLabelingEvent: EventDef<Attributes, EventType.SettingsGeneralLabeling> =
    {
        name: EventType.SettingsGeneralLabeling,
        descriptionTrigger:
            'User changes the labeling method in Settings > General > Labeling (off, legacy, or Suite Sync)',
        changelog: [
            { version: '1.21.0', notes: 'added' },
            { version: '25.11.1', notes: 'updated' },
        ],

        attributes: {
            value: {
                changelog: [{ version: '1.21.0', notes: 'added' }],
                description: `- \`off\` - when user turned labeling off
- \`legacy\` - when user turned legacy labeling
- \`suite-sync\` - when user turned on the Suite Sync`,
            },
        },
    };
