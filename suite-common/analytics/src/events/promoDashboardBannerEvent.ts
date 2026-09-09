import { EventType } from '../constants';
import type { AttributeDef, EventDef } from '../eventDefinition';

type Attributes = {
    action: AttributeDef<'cta' | 'close'>;
    bannerType?: AttributeDef<'defi-yield' | 'eth-vault' | 'ts7'>;
};

export const promoDashboardBannerEvent: EventDef<Attributes, EventType.PromoDashboardBanner> = {
    name: EventType.PromoDashboardBanner,
    descriptionTrigger: 'User interacts with a promotional banner on the dashboard',
    changelog: [
        { version: '25.8.0', notes: 'added' },
        { version: '26.8.0', notes: 'added the `defi-yield` banner identifier' },
        { version: '26.8.0', notes: 'implemented for mobile' },
        { version: '26.11.0', notes: 'removed the `stablecoin-yield` banner identifier' },
    ],

    attributes: {
        action: {
            description:
                'The user action: `cta` when clicking the call-to-action link, `close` when dismissing the banner',
            changelog: [{ version: '25.8.0', notes: 'added' }],
        },
        bannerType: {
            description:
                'Identifier of the promotional banner: `defi-yield`, `eth-vault`, or `ts7`',
            changelog: [
                { version: '25.8.0', notes: 'added' },
                { version: '26.8.0', notes: 'added `defi-yield`' },
                { version: '26.11.0', notes: 'removed `stablecoin-yield`' },
            ],
        },
    },
};
