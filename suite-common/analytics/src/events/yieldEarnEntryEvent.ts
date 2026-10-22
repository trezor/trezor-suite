import { EventType } from '../constants';
import type { AttributeDef, EventDef } from '../eventDefinition';

type Attributes = {
    from: AttributeDef<string>;
};

export const yieldEarnEntryEvent: EventDef<Attributes, EventType.YieldEarnEntry> = {
    name: EventType.YieldEarnEntry,
    descriptionTrigger:
        'Fired when the user enters the Earn dashboard, including a direct initial load; once per visit on both platforms. Returning from an overlay, including device authorization, does not start another visit.',
    changelog: [
        { version: '26.5.2', notes: 'added' },
        {
            version: '26.11.0',
            notes: 'Shared by desktop and mobile; replaces mobile earn/navigate.',
        },
    ],

    attributes: {
        from: {
            description:
                'Previous static route name (e.g. `suite-index` or `Home`); platform route names differ. `unknown` if the user landed via initial load / direct route / refresh.',
            changelog: [{ version: '26.5.2', notes: 'added' }],
        },
    },
};
