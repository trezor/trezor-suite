import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    type: AttributeDef<'staking' | 'sell' | 'swap' | 'send'>;
    value: AttributeDef<'10%' | '25%' | '50%' | 'max'>;
};

export const appFormPercentButtonsEvent: EventDef<Attributes, EventType.AppFormPercentButtons> = {
    name: EventType.AppFormPercentButtons,
    descriptionTrigger:
        'Fired when user clicks 10%, 25%, 50% or MAX in staking/sell/swap/send form',
    changelog: [{ version: '26.2.0', notes: 'added' }],

    attributes: {
        type: {
            changelog: [{ version: '26.2.0', notes: 'added' }],
            description: 'Specifies place in the app where the button was clicked',
        },
        value: {
            changelog: [{ version: '26.2.0', notes: 'added' }],
            description: 'Specifies the value of the button that was clicked (percentage or max)',
        },
    },
};
