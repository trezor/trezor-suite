import { EventType } from '../constants';
import type { AttributeDef, EventDef } from '../eventDefinition';

type Attributes = {
    action: AttributeDef<'cta' | 'close'>;
    bannerType?: AttributeDef<
        | 'defi-yield'
        | 'eth-vault'
        | 'trading-experience'
        | 'ts7'
        | 'bfh26-ts7-accessory-pack'
        | 'bfh26-keep-metal'
        | 'bfh26-ts3-gift'
        | 'bfh26-ts3-backup'
        | 'bfh26-ts7-complete-kit'
        | 'bfh26-egift-card'
        | 'bfh26-ts7-upgrade'
    >;
};

export const promoDashboardBannerEvent: EventDef<Attributes, EventType.PromoDashboardBanner> = {
    name: EventType.PromoDashboardBanner,
    descriptionTrigger: 'User interacts with a promotional banner on the dashboard',
    changelog: [
        { version: '25.8.0', notes: 'added' },
        { version: '26.8.0', notes: 'added the `defi-yield` banner identifier' },
        { version: '26.8.0', notes: 'implemented for mobile' },
        { version: '26.11.0', notes: 'removed the `stablecoin-yield` banner identifier' },
        { version: '26.11.0', notes: 'added the `trading-experience` banner identifier' },
        { version: '26.11.0', notes: 'added Black Friday Holiday 2026 banner identifiers' },
    ],

    attributes: {
        action: {
            description:
                'The user action: `cta` when clicking the call-to-action link, `close` when dismissing the banner',
            changelog: [{ version: '25.8.0', notes: 'added' }],
        },
        bannerType: {
            description:
                'Identifier of the promotional banner: `defi-yield`, `eth-vault`, `trading-experience`, `ts7`, or a Black Friday Holiday 2026 variant prefixed with `bfh26-`',
            changelog: [
                { version: '25.8.0', notes: 'added' },
                { version: '26.8.0', notes: 'added `defi-yield`' },
                { version: '26.11.0', notes: 'removed `stablecoin-yield`' },
                { version: '26.11.0', notes: 'added `trading-experience`' },
                { version: '26.11.0', notes: 'added Black Friday Holiday 2026 variants' },
            ],
        },
    },
};
