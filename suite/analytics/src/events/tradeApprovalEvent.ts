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

export const tradeApprovalEvent: EventDef<Attributes, EventType.TradingExchangeApproval> = {
    name: EventType.TradingExchangeApproval,
    descriptionTrigger: 'user interacts with an approve/revoke DEX swap transaction on EVM chains',
    changelog: [{ version: '25.9.0', notes: 'added' }],

    attributes: {
        type: {
            changelog: [{ version: '25.9.0', notes: 'added' }],
        },
        action: {
            changelog: [{ version: '25.9.0', notes: 'added' }],
        },
        sendCryptoLabel: {
            changelog: [{ version: '25.9.0', notes: 'added' }],
        },
        sendCryptoNetworkSymbol: {
            changelog: [{ version: '25.9.0', notes: 'added' }],
        },
        sendCryptoContractAddress: {
            changelog: [{ version: '25.9.0', notes: 'added' }],
        },
        receiveCryptoLabel: {
            changelog: [{ version: '25.9.0', notes: 'added' }],
        },
        receiveCryptoNetworkSymbol: {
            changelog: [{ version: '25.9.0', notes: 'added' }],
        },
        receiveCryptoContractAddress: {
            changelog: [{ version: '25.9.0', notes: 'added' }],
        },
        selectedFee: {
            changelog: [{ version: '25.9.0', notes: 'added' }],
        },
        exchangeName: {
            changelog: [{ version: '25.9.0', notes: 'added' }],
        },
    },
};
