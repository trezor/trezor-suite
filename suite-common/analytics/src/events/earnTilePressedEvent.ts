import { EventType } from '../constants';
import type { AttributeDef, EventDef } from '../eventDefinition';

type Attributes = {
    id: AttributeDef<string>;
    asset: AttributeDef<string>;
    type: AttributeDef<'staking' | 'yield'>;
};

export const earnTilePressedEvent: EventDef<Attributes, EventType.EarnTilePressed> = {
    name: EventType.EarnTilePressed,
    descriptionTrigger: 'User presses an opportunity tile on the Earn dashboard.',
    changelog: [
        {
            version: '26.11.0',
            notes: 'Replaces earn/stake-tile-pressed and earn/stablecoin-yield-tile-pressed.',
        },
    ],
    attributes: {
        id: {
            description:
                'Public vault ID for yield; network symbol for staking. Never an account or device identifier.',
            changelog: [{ version: '26.11.0', notes: 'added' }],
        },
        asset: {
            description:
                'Underlying token symbol for yield, or network symbol for staking; lowercase.',
            changelog: [{ version: '26.11.0', notes: 'added' }],
        },
        type: {
            description: 'Opportunity type: staking or yield.',
            changelog: [{ version: '26.11.0', notes: 'added' }],
        },
    },
};
