import { EventType } from '../constants';
import type { AttributeDef, EventDef } from '../eventDefinition';

type Attributes = {
    from: AttributeDef<'asset-detail'>;
    type: AttributeDef<'viewInExplorer'>;
};

export const appExternalLinkEvent: EventDef<Attributes, EventType.AppExternalLink> = {
    name: EventType.AppExternalLink,
    descriptionTrigger: 'User opens an external link',
    changelog: [{ version: '26.11.0', notes: 'added' }],

    attributes: {
        from: {
            changelog: [{ version: '26.11.0', notes: 'added' }],
            description: 'Where the link was opened from: `asset-detail` for the asset detail menu',
        },
        type: {
            changelog: [{ version: '26.11.0', notes: 'added' }],
            description: 'Which link was opened: `viewInExplorer` for the block explorer',
        },
    },
};
