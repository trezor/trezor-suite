import type { AttributeDef, EventDef } from '@suite-common/analytics';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import { type TokenAddress, type TokenSymbol } from '@suite-common/wallet-types';

import { EventType } from '../constants';

type SendFlowLocation = 'dashboard' | 'accountDetail';

type Attributes = {
    location: AttributeDef<SendFlowLocation>;
    assetSymbol: AttributeDef<NetworkSymbol>;
    tokenSymbol?: AttributeDef<TokenSymbol>;
    tokenContract?: AttributeDef<TokenAddress>;
};

export const sendFlowEnteredEvent: EventDef<Attributes, EventType.SendFlowEntered> = {
    name: EventType.SendFlowEntered,
    descriptionTrigger: 'Dispatched when user enters the send flow.',
    changelog: [{ version: '25.5.1', notes: 'Added' }],
    attributes: {
        location: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description: 'Describes from where was send flow entered.',
        },
        assetSymbol: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description: 'Describes the network of the account ("btc", "eth" … ).',
        },
        tokenSymbol: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description: 'Symbol of the token ("usdt", "link"...).',
        },
        tokenContract: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description:
                "Token contract address, e.g: '0xdac17f958d2ee523a2206206994597c13d831ec7'.",
        },
    },
};
