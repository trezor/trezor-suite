import type { AttributeDef, EventDef } from '@suite-common/analytics';
import type { NetworkSymbol } from '@suite-common/wallet-config';

import { EventType } from '../constants';

type Attributes = {
    assetSymbol: AttributeDef<NetworkSymbol>;
};

// @ts-expect-error deprecated event name (see `EventName` in `suite-common/analytics/src/eventDefinition.ts`)
export const createReceiveAddressEvent: EventDef<Attributes, EventType.CreateReceiveAddress> = {
    name: EventType.CreateReceiveAddress,
    descriptionTrigger: 'On receive address creation.',
    changelog: [{ version: '23.4.1', notes: 'added' }],

    attributes: {
        assetSymbol: {
            changelog: [{ version: '23.4.1', notes: 'added' }],
            description: 'Describes the network of the account',
        },
    },
};
