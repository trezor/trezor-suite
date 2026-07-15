import type { AttributeDef, EventDef } from '@suite-common/analytics';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import {
    type FeeLevelLabel,
    type TokenAddress,
    type TokenSymbol,
} from '@suite-common/wallet-types';

import { EventType } from '../constants';

type Attributes = {
    symbol: AttributeDef<NetworkSymbol>;
    outputsCount: AttributeDef<number>;
    selectedFee: AttributeDef<FeeLevelLabel>;
    wasAppLeftDuringReview: AttributeDef<boolean>;
    tokenSymbols?: AttributeDef<TokenSymbol[]>;
    tokenAddresses?: AttributeDef<TokenAddress[]>;
    hasEthereumData?: AttributeDef<boolean>;
    hasEthereumNonce?: AttributeDef<boolean>;
    hasDestinationTag?: AttributeDef<boolean>;
    hasBitcoinLocktime?: AttributeDef<boolean>;
};

export const sendTransactionDispatchedEvent: EventDef<
    Attributes,
    EventType.SendTransactionDispatched
> = {
    name: EventType.SendTransactionDispatched,
    descriptionTrigger: 'User successfully sends a transaction',
    changelog: [{ version: '24.10.1', notes: 'added' }],
    attributes: {
        symbol: {
            description:
                'The blockchain network symbol for the transaction (e.g., `btc`, `eth`, `ada`)',
            changelog: [{ version: '24.10.1', notes: 'added' }],
        },
        outputsCount: {
            description: 'The number of outputs (recipients) in the transaction',
            changelog: [{ version: '24.10.1', notes: 'added' }],
        },
        selectedFee: {
            description:
                'The fee level chosen for the transaction: `high`, `normal`, `economy`, `low`, or `custom`',
            changelog: [{ version: '24.10.1', notes: 'added' }],
        },
        wasAppLeftDuringReview: {
            changelog: [{ version: '24.10.1', notes: 'added' }],
            description:
                'Whether the user left the app during transaction review. Note: false does not mean the user confirmed the address with the source (e.g., can be done face to face or on desktop). Leaving the app does not imply address verification was skipped.',
        },
        tokenSymbols: {
            description:
                'List of token symbols included in the transaction (only for multi-token transactions)',
            changelog: [{ version: '24.10.1', notes: 'added' }],
        },
        tokenAddresses: {
            description:
                'List of contract addresses for tokens included in the transaction (only for multi-token transactions)',
            changelog: [{ version: '24.10.1', notes: 'added' }],
        },
        hasEthereumData: {
            description: 'Whether the transaction includes Ethereum-specific data payload',
            changelog: [{ version: '24.10.1', notes: 'added' }],
        },
        hasEthereumNonce: {
            description: 'Whether the transaction includes an Ethereum nonce field',
            changelog: [{ version: '24.10.1', notes: 'added' }],
        },
        hasDestinationTag: {
            description:
                'Whether the transaction includes a destination tag (specific to certain networks like Ripple)',
            changelog: [{ version: '24.10.1', notes: 'added' }],
        },
        hasBitcoinLocktime: {
            description: 'Whether the Bitcoin transaction includes a locktime/timelock parameter',
            changelog: [{ version: '24.10.1', notes: 'added' }],
        },
    },
};
