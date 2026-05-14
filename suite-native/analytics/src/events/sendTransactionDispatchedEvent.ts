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
    descriptionTrigger: 'Dispatched when a user successfully send a transaction.',
    changelog: [{ version: '24.10.1', notes: 'Added' }],
    attributes: {
        symbol: { changelog: [{ version: '24.10.1', notes: 'added' }] },
        outputsCount: { changelog: [{ version: '24.10.1', notes: 'added' }] },
        selectedFee: { changelog: [{ version: '24.10.1', notes: 'added' }] },
        wasAppLeftDuringReview: {
            changelog: [{ version: '24.10.1', notes: 'added' }],
            description:
                'Note: false does not mean the user did not confirm the address with the source (e.g. can be face to face or source on desktop). Leaving the app does not imply checking the address.',
        },
        tokenSymbols: { changelog: [{ version: '24.10.1', notes: 'added' }] },
        tokenAddresses: { changelog: [{ version: '24.10.1', notes: 'added' }] },
        hasEthereumData: { changelog: [{ version: '24.10.1', notes: 'added' }] },
        hasEthereumNonce: { changelog: [{ version: '24.10.1', notes: 'added' }] },
        hasDestinationTag: { changelog: [{ version: '24.10.1', notes: 'added' }] },
        hasBitcoinLocktime: { changelog: [{ version: '24.10.1', notes: 'added' }] },
    },
};
