import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    type: AttributeDef<'approve-modal' | 'exchange-form' | 'revoke-modal'>;
    action: AttributeDef<
        | 'continue'
        | 'cancel'
        | 'refresh'
        | 'swap'
        | 'limit-exact'
        | 'limit-unlimited'
        | 'revoke'
        | 'approve'
    >;

    sendCryptoLabel?: AttributeDef<string>;
    sendCryptoNetworkSymbol?: AttributeDef<string>;
    sendCryptoContractAddress?: AttributeDef<string>;

    receiveCryptoLabel?: AttributeDef<string>;
    receiveCryptoNetworkSymbol?: AttributeDef<string>;
    receiveCryptoContractAddress?: AttributeDef<string>;

    selectedFee?: AttributeDef<string>;
    exchangeName?: AttributeDef<string>;
};

export const tradeApprovalEvent: EventDef<Attributes, EventType.TradeApproval> = {
    name: EventType.TradeApproval,
    descriptionTrigger:
        'User interacts with an approve or revoke DEX swap transaction on Ethereum Virtual Machine (EVM) compatible blockchains',
    changelog: [{ version: '25.9.0', notes: 'added' }],

    attributes: {
        type: {
            description:
                'The type of approval interaction: `approve-modal` for token approval, `exchange-form` for exchange form action, `revoke-modal` for token revocation',
            changelog: [{ version: '25.9.0', notes: 'added' }],
        },
        action: {
            description:
                'The user action performed: `continue` to proceed, `cancel` to abort, `refresh` to refresh, `swap` to execute swap, `limit-exact` for minimal token approval amount, `limit-unlimited` for infinite token approval amount, `revoke` to revoke, `approve` to approve',
            changelog: [{ version: '25.9.0', notes: 'added' }],
        },
        sendCryptoLabel: {
            description: 'User-friendly label or name of the cryptocurrency being sent',
            changelog: [{ version: '25.9.0', notes: 'added' }],
        },
        sendCryptoNetworkSymbol: {
            description:
                'The blockchain network symbol for the sent cryptocurrency (e.g., `eth`, `bsc`)',
            changelog: [{ version: '25.9.0', notes: 'added' }],
        },
        sendCryptoContractAddress: {
            description: 'The smart contract address of the token being sent',
            changelog: [{ version: '25.9.0', notes: 'added' }],
        },
        receiveCryptoLabel: {
            description: 'User-friendly label or name of the cryptocurrency being received',
            changelog: [{ version: '25.9.0', notes: 'added' }],
        },
        receiveCryptoNetworkSymbol: {
            description:
                'The blockchain network symbol for the received cryptocurrency (e.g., `eth`, `bsc`)',
            changelog: [{ version: '25.9.0', notes: 'added' }],
        },
        receiveCryptoContractAddress: {
            description: 'The smart contract address of the token being received',
            changelog: [{ version: '25.9.0', notes: 'added' }],
        },
        selectedFee: {
            description: 'The selected transaction fee level or custom gas price',
            changelog: [{ version: '25.9.0', notes: 'added' }],
        },
        exchangeName: {
            description: 'The name of the DEX exchange or trading provider being used',
            changelog: [{ version: '26.3.1', notes: 'added' }],
        },
    },
};
