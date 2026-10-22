import type { EarnAnalyticsStep, EarnModalAction } from '@suite-common/suite-types';

import { EventType } from '../constants';
import { type EarnDeviceStatus, deviceStatusAttribute } from '../earnAttributes';
import type { AttributeDef, EventDef } from '../eventDefinition';

export type StakingClaimStep = Extract<EarnAnalyticsStep, 'staking-dashboard' | 'claim-form-modal'>;

type Attributes = {
    action: AttributeDef<EarnModalAction>;
    deviceStatus?: AttributeDef<EarnDeviceStatus>;
    step: AttributeDef<StakingClaimStep>;
    networkSymbol?: AttributeDef<string>;
};

export const stakingClaimEvent: EventDef<Attributes, EventType.StakingClaim> = {
    name: EventType.StakingClaim,
    descriptionTrigger:
        'User navigates through the staking reward/claim flow, with tracking at each step of the process',
    changelog: [
        { version: '25.4.0', notes: 'added' },
        { version: '26.11.0', notes: 'Shared event definition for mobile and desktop.' },
    ],

    attributes: {
        deviceStatus: deviceStatusAttribute,
        action: {
            description:
                'The user action: `continue` to proceed with claiming, `cancel` to abort, or `close` to dismiss the modal',
            changelog: [
                { version: '25.4.0', notes: 'added' },
                {
                    version: '26.3.0',
                    notes: 'action values changed to `continue` | `cancel` | `close`',
                },
            ],
        },
        step: {
            description:
                'The step in the claim flow: `staking-dashboard` for main dashboard or `claim-form-modal` for claim form',
            changelog: [{ version: '25.4.0', notes: 'added' }],
        },
        networkSymbol: {
            description:
                'The blockchain network symbol for which rewards are being claimed (e.g., `eth`)',
            changelog: [{ version: '25.4.0', notes: 'added' }],
        },
    },
};
