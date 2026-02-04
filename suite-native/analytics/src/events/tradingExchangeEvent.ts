import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';
import type { TradingExchangeAction, TradingExchangeStep } from '../definitions';

type Attributes = {
    action: AttributeDef<TradingExchangeAction>;
    step: AttributeDef<TradingExchangeStep>;
    sendCryptoLabel?: AttributeDef<string>;
    sendCryptoNetworkSymbol?: AttributeDef<string>;
    sendCryptoContractAddress?: AttributeDef<string>;
    receiveCryptoLabel?: AttributeDef<string>;
    receiveCryptoNetworkSymbol?: AttributeDef<string>;
    receiveCryptoContractAddress?: AttributeDef<string>;
    exchangeName?: AttributeDef<string>;
    exchangeType?: AttributeDef<string>;
    accountType?: AttributeDef<string>;
    approvalType?: AttributeDef<string>;
    slippage?: AttributeDef<string>;
    rateType?: AttributeDef<string>;
};

const stepDescription = `- \`account-selection\` - going to selecting account for receiving crypto
- \`transaction-preview\` - actions \`visit\` on visiting page, \`continue\` on going to txn signing, \`cancel\` on going back and \`retry\` on retrying trade confirmation on api, in case it failed
- \`fee-selection\` - visit on visiting fee selection screen
- \`sign-and-send\` - \`visit\` on visiting screen, \`continue\` on tap on sending txn, \`cancel\` on any kind of going back and \`retry\` on tapping retry after failed txn
- \`webview\` - visit on visiting webview usually needed for kyc or whatever partner needs`;

export const tradingExchangeEvent: EventDef<Attributes, EventType.TradingExchange> = {
    name: EventType.TradingExchange,
    descriptionTrigger: 'Actions related to exchange (swap)',
    changelog: [{ version: '25.10.1', notes: 'added' }],
    attributes: {
        action: { changelog: [{ version: '25.10.1', notes: 'added' }] },
        step: {
            changelog: [{ version: '25.10.1', notes: 'added' }],
            description: stepDescription,
        },
        sendCryptoLabel: {
            changelog: [{ version: '25.10.1', notes: 'added' }],
            description: 'Name of asset e.g. USDC',
        },
        sendCryptoNetworkSymbol: {
            changelog: [{ version: '25.10.1', notes: 'added' }],
            description: 'Symbol of network on which sent asset runs - e.g. eth',
        },
        sendCryptoContractAddress: {
            changelog: [{ version: '25.10.1', notes: 'added' }],
            description:
                'If present it means the asset is token and this is contract address of that token',
        },
        receiveCryptoLabel: { changelog: [{ version: '25.10.1', notes: 'added' }] },
        receiveCryptoNetworkSymbol: { changelog: [{ version: '25.10.1', notes: 'added' }] },
        receiveCryptoContractAddress: { changelog: [{ version: '25.10.1', notes: 'added' }] },
        exchangeName: { changelog: [{ version: '25.10.1', notes: 'added' }] },
        exchangeType: { changelog: [{ version: '25.10.1', notes: 'added' }] },
        accountType: { changelog: [{ version: '25.10.1', notes: 'added' }] },
        approvalType: { changelog: [{ version: '25.10.1', notes: 'added' }] },
        slippage: { changelog: [{ version: '25.10.1', notes: 'added' }] },
        rateType: { changelog: [{ version: '25.10.1', notes: 'added' }] },
    },
};
