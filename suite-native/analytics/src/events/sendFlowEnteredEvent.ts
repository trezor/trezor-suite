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
    descriptionTrigger: 'User enters the cryptocurrency send transaction flow',
    changelog: [{ version: '25.5.1', notes: 'added' }],
    attributes: {
        location: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description:
                'Where the send flow was initiated: `dashboard` from the main dashboard, `accountDetail` from an account detail page',
        },
        assetSymbol: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description:
                'The blockchain network symbol for which the transaction is being sent (e.g., `btc`, `eth`, `ada`)',
        },
        tokenSymbol: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description:
                'The symbol of the token being sent (only for token transfers, not native assets)',
        },
        tokenContract: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description:
                'Contract address of the token being sent (only for token transfers, e.g., "0xdac17f958d2ee523a2206206994597c13d831ec7")',
        },
    },
};
