import type { AttributeDef, EventDef } from '@suite-common/analytics';
import { NetworkSymbol } from '@suite-common/wallet-config';

import { EventType } from '../constants';

type Attributes = {
    assetSymbol: AttributeDef<NetworkSymbol>;
};

export const createReceiveAddressCopyAddressEvent: EventDef<
    Attributes,
    // @ts-expect-error deprecated event name (see `EventName` in `suite-common/analytics/src/eventDefinition.ts`)
    EventType.CreateReceiveAddressCopyAddress
> = {
    name: EventType.CreateReceiveAddressCopyAddress,
    descriptionTrigger: 'Desktop: Receive → Show full address → Copy',
    changelog: [{ version: '25.4.1', notes: 'added' }],

    attributes: {
        assetSymbol: {
            changelog: [{ version: '25.4.1', notes: 'added' }],
        },
    },
};
