import { type AccountType, type NetworkSymbol } from '@suite-common/wallet-config';
import { type TokenSymbol } from '@suite-common/wallet-types';

import { EventType } from '../constants';
import type { AttributeDef, EventDef } from '../eventDefinition';

type Attributes = {
    network: AttributeDef<NetworkSymbol>;
    accountType: AttributeDef<AccountType>;
    index: AttributeDef<number>;
    hasStaked: AttributeDef<boolean>;
    hasTraded: AttributeDef<boolean>;
    tokenSymbols: AttributeDef<TokenSymbol[]>;
    stakingProviders: AttributeDef<string[]>;
};

export const accountsInfoEvent: EventDef<Attributes, EventType.AccountsInfo> = {
    name: EventType.AccountsInfo,
    descriptionTrigger:
        'Fired right after discovery of account (new accounts) or after account update. Unique attributes are network + index + accountType',
    changelog: [{ version: '26.7.0', notes: 'added' }],

    attributes: {
        network: {
            changelog: [{ version: '26.7.0', notes: 'added' }],
            description: 'The blockchain network symbol of the account (e.g., `btc`, `eth`, `sol`)',
        },
        accountType: {
            changelog: [{ version: '26.7.0', notes: 'added' }],
            description:
                'The account type (`normal`, `segwit`, `legacy`, `taproot`, `coinjoin`, `ledger`)',
        },
        index: {
            changelog: [{ version: '26.7.0', notes: 'added' }],
            description: 'The 0-based account index within its network and account type',
        },
        hasStaked: {
            changelog: [{ version: '26.7.0', notes: 'added' }],
            description: 'Whether the account has an active staking position',
        },
        hasTraded: {
            changelog: [{ version: '26.7.0', notes: 'added' }],
            description: 'Whether the account has been used for a Trade (buy, sell, or exchange)',
        },
        tokenSymbols: {
            changelog: [{ version: '26.7.0', notes: 'added' }],
            description:
                'Symbols of legit tokens with a non-zero balance held by the account; the network native token is listed first when held (e.g., `ETH`, `USDC`, `DAI`)',
        },
        stakingProviders: {
            changelog: [{ version: '26.7.0', notes: 'added' }],
            description:
                'List of staking providers detected for this account (e.g., `everstake`, `fivebinaries`, `luganodes`, `p2p.org`)',
        },
    },
};
