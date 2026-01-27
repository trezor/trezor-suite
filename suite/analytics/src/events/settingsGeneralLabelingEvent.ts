import type { AttributeDef, EventDef } from '@suite-common/analytics-types';

import { EventType } from '../constants';

type Attributes = {
    value: AttributeDef<'off' | 'legacy' | 'evolu'>;
};

export const settingsGeneralLabelingEvent: EventDef<Attributes, EventType.SettingsGeneralLabeling> =
    {
        name: EventType.SettingsGeneralLabeling,
        descriptionTrigger: 'Toggle labeling in application settings',
        changelog: [
            { version: '1.21.0', notes: 'added' },
            { version: '25.11.1', notes: 'updated' },
        ],

        attributes: {
            value: {
                changelog: [{ version: '1.21.0', notes: 'added' }],
                description: `- \`off\` - when user turned labeling off
- \`legacy\` - when user turned legacy labeling
- \`evolu\` - when user turned on secure sync / locale first storage / Evolu`,
            },
        },
    };
