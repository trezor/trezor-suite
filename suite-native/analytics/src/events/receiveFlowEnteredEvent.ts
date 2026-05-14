import type { AttributeDef, EventDef } from '@suite-common/analytics';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import { type TokenAddress, type TokenSymbol } from '@suite-common/wallet-types';

import { EventType } from '../constants';

type ReceiveFlowLocation = 'dashboard' | 'accountDetail';

type Attributes = {
    location: AttributeDef<ReceiveFlowLocation>;
    assetSymbol: AttributeDef<NetworkSymbol>;
    tokenSymbol?: AttributeDef<TokenSymbol>;
    tokenContract?: AttributeDef<TokenAddress>;
};

export const receiveFlowEnteredEvent: EventDef<Attributes, EventType.ReceiveFlowEntered> = {
    name: EventType.ReceiveFlowEntered,
    descriptionTrigger: '?',
    changelog: [{ version: '?', notes: 'Added' }],
    attributes: {
        location: { changelog: [{ version: '?', notes: 'added' }] },
        assetSymbol: { changelog: [{ version: '?', notes: 'added' }] },
        tokenSymbol: { changelog: [{ version: '?', notes: 'added' }] },
        tokenContract: { changelog: [{ version: '?', notes: 'added' }] },
    },
};
