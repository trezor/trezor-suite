import type { AttributeDef, EventDef } from '@suite-common/analytics';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import { type TokenAddress, type TokenSymbol } from '@suite-common/wallet-types';

import { EventType } from '../constants';

type ReceiveFlowLocation = 'dashboard' | 'accountDetail';

type Attributes = {
    location: AttributeDef<ReceiveFlowLocation>;
    assetSymbol?: AttributeDef<NetworkSymbol>;
    tokenSymbol?: AttributeDef<TokenSymbol>;
    tokenContract?: AttributeDef<TokenAddress>;
};

export const receiveFlowEnteredEvent: EventDef<Attributes, EventType.ReceiveFlowEntered> = {
    name: EventType.ReceiveFlowEntered,
    descriptionTrigger:
        'User enters the receive cryptocurrency flow to generate a receiving address',
    changelog: [{ version: '26.2.2', notes: 'added' }],
    attributes: {
        location: {
            description:
                'Where the receive flow was initiated from: `dashboard` from the main dashboard, `accountDetail` from an account detail page',
            changelog: [{ version: '26.2.2', notes: 'added' }],
        },
        assetSymbol: {
            description:
                'The blockchain network symbol for which the user is generating a receive address (e.g., `btc`, `eth`, `ada`); omitted when entering from the dashboard before selecting an account',
            changelog: [
                { version: '26.2.2', notes: 'added' },
                { version: '26.8.1', notes: 'made optional for dashboard entry' },
            ],
        },
        tokenSymbol: {
            description:
                'The symbol of the token for which the user is generating a receive address, only present when receiving a specific token rather than the native asset',
            changelog: [{ version: '26.2.2', notes: 'added' }],
        },
        tokenContract: {
            description:
                'The contract address of the token for which the user is generating a receive address, only present for non-native tokens',
            changelog: [{ version: '26.2.2', notes: 'added' }],
        },
    },
};
