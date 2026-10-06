import type { AttributeDef, EventDef } from '@suite-common/analytics';
import type { NetworkSymbol } from '@suite-common/wallet-config';

import { EventType } from '../constants';

export type SendEnsResolutionDirection = 'direct' | 'reverse';

type Attributes = {
    assetSymbol: AttributeDef<NetworkSymbol>;
    direction: AttributeDef<SendEnsResolutionDirection>;
};

export const sendEnsResolutionEvent: EventDef<Attributes, EventType.SendEnsResolution> = {
    name: EventType.SendEnsResolution,
    descriptionTrigger:
        'The send form recipient field resolves a name for the first time in a given direction. Reported once per direction per recipient input, and carries nothing about what was resolved or whether the lookup found anything',
    changelog: [{ version: '26.9.1', notes: 'added' }],
    attributes: {
        assetSymbol: {
            description:
                'The blockchain network symbol the resolution ran on (e.g., `eth`, `tsep`)',
            changelog: [{ version: '26.9.1', notes: 'added' }],
        },
        direction: {
            description:
                'Which way the recipient field resolved: `direct` for a name the user typed being resolved to an address, `reverse` for the primary name of an address the user typed',
            changelog: [{ version: '26.9.1', notes: 'added' }],
        },
    },
};
