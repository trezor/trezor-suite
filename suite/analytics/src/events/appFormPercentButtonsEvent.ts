import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    type: AttributeDef<'staking' | 'send' | 'exchange'>;
    value: AttributeDef<'10%' | '25%' | '50%' | 'max'>;
};

export const appFormPercentButtonsEvent: EventDef<Attributes, EventType.AppFormPercentButtons> = {
    name: EventType.AppFormPercentButtons,
    descriptionTrigger: 'fired when user clicks 10%, 25%, 50% or MAX in send or staking form',
    changelog: [{ version: '26.0.0', notes: 'added' }],

    attributes: {
        type: {
            changelog: [{ version: '26.3.0', notes: 'added' }],
        },
        value: {
            changelog: [{ version: '26.3.0', notes: 'added' }],
        },
    },
};
