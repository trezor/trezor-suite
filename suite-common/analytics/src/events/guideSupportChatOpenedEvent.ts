import { EventType } from '../constants';
import type { AnalyticsPlatform, AttributeDef, EventDef } from '../eventDefinition';

type Attributes = {
    systemInfoShared: AttributeDef<boolean>;
    platform: AttributeDef<AnalyticsPlatform>;
};

export const guideSupportChatOpenedEvent: EventDef<Attributes, EventType.GuideSupportChatOpened> = {
    name: EventType.GuideSupportChatOpened,
    descriptionTrigger:
        'Fired when a user opens the support chat from the support consent prompt. Emitted by both desktop (guide) and mobile (settings FAQ contact support).',
    description:
        'Measures how often users reach out to support and whether they opt in to sharing system information.',
    changelog: [{ version: '26.7.1', notes: 'added' }],

    attributes: {
        systemInfoShared: {
            changelog: [{ version: '26.7.1', notes: 'added' }],
            description:
                '`true` if the user kept the "share system info" toggle checked, `false` if unchecked.',
        },
        platform: {
            changelog: [{ version: '26.7.1', notes: 'added' }],
            description: '`desktop` or `mobile`, identifying which app emitted the event.',
        },
    },
};
