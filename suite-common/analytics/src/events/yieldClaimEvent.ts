import type { EarnModalAction } from '@suite-common/suite-types';

import { EventType } from '../constants';
import { type EarnDeviceStatus, deviceStatusAttribute } from '../earnAttributes';
import type { AttributeDef, EventDef } from '../eventDefinition';

type Attributes = {
    action: AttributeDef<EarnModalAction>;
    deviceStatus?: AttributeDef<EarnDeviceStatus>;
    type: AttributeDef<'claim' | 'tx-simulation-modal' | 'success' | 'error' | 'leftPending'>;
    networkSymbol?: AttributeDef<string>;
    durationMs?: AttributeDef<number>;
    rewardCount?: AttributeDef<number>;
    errorMessage?: AttributeDef<string>;
};

export const yieldClaimEvent: EventDef<Attributes, EventType.YieldClaim> = {
    name: EventType.YieldClaim,
    descriptionTrigger: 'fired on stablecoin yield claim actions',
    changelog: [
        { version: '26.5.0', notes: 'added' },
        { version: '26.7.1', notes: 'moved to suite-common, reported from mobile as well' },
        {
            version: '26.11.0',
            notes: 'Desktop reports one success per confirmed claim transaction while waiting for Merkl. Mobile simulation cancellation includes backdrop and gesture dismissal exactly once and excludes dismissal after Continue.',
        },
    ],

    attributes: {
        deviceStatus: deviceStatusAttribute,
        action: {
            changelog: [{ version: '26.5.0', notes: 'added' }],
        },
        type: {
            changelog: [
                { version: '26.5.0', notes: 'added' },
                {
                    version: '26.5.2',
                    notes: 'added `leftPending`, `tx-simulation-modal` values',
                },
            ],
        },
        networkSymbol: {
            changelog: [{ version: '26.5.0', notes: 'added' }],
        },
        durationMs: {
            description:
                'Milliseconds between submission (pending tx appearing in state) and resolution (success / error / leftPending)',
            changelog: [{ version: '26.5.2', notes: 'added' }],
        },
        rewardCount: {
            description: 'Number of reward items included in the claim',
            changelog: [{ version: '26.5.2', notes: 'added' }],
        },
        errorMessage: {
            changelog: [
                { version: '26.5.0', notes: 'added' },
                {
                    version: '26.9.0',
                    notes: 'desktop no longer reports a cancelled PIN entry as `submit-failed`',
                },
            ],
        },
    },
};
