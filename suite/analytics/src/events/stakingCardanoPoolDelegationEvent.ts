import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    fromPool?: AttributeDef<string>;
    toPool: AttributeDef<string>;
    toPoolSaturation?: AttributeDef<number>;
    poolsDataAvailable: AttributeDef<boolean>;
    isEverstakeToEverstake: AttributeDef<boolean>;
};

export const stakingCardanoPoolDelegationEvent: EventDef<
    Attributes,
    EventType.StakingCardanoPoolDelegation
> = {
    name: EventType.StakingCardanoPoolDelegation,
    descriptionTrigger: 'A Cardano pool delegation transaction is successfully broadcast',
    changelog: [{ version: '26.8.0', notes: 'added' }],

    attributes: {
        fromPool: {
            changelog: [{ version: '26.8.0', notes: 'added' }],
            description:
                'Pool the account was delegated to before — name (e.g. EVE7) when known, bech32 id otherwise; not sent for a first delegation',
        },
        toPool: {
            changelog: [{ version: '26.8.0', notes: 'added' }],
            description:
                'Pool the new delegation certificate points to — name (e.g. EVE8) when known, bech32 id otherwise',
        },
        toPoolSaturation: {
            changelog: [{ version: '26.8.0', notes: 'added' }],
            description:
                'Saturation percentage (0-100) of the target pool at selection time; not sent when pool data is unavailable',
        },
        poolsDataAvailable: {
            changelog: [{ version: '26.8.0', notes: 'added' }],
            description: 'Whether the pools endpoint data was available at pool selection time',
        },
        isEverstakeToEverstake: {
            changelog: [{ version: '26.8.0', notes: 'added' }],
            description:
                'Whether an account already delegated to an Everstake pool is being moved to a different pool; expected to always be `false`, `true` signals a regression',
        },
    },
};
