import { EventType } from '../constants';
import type { AnalyticsPlatform, AttributeDef, EventDef } from '../eventDefinition';

export type NoDeviceEshopCtaOrigin = 'dashboard' | 'settings';
type PromoNoDeviceEshopCtaAction = 'cta' | 'close';

type Attributes = {
    origin: AttributeDef<NoDeviceEshopCtaOrigin>;
    platform: AttributeDef<AnalyticsPlatform>;
    action: AttributeDef<PromoNoDeviceEshopCtaAction>;
};

export const promoNoDeviceEshopCtaEvent: EventDef<Attributes, EventType.PromoNoDeviceEshopCta> = {
    name: EventType.PromoNoDeviceEshopCta,
    descriptionTrigger:
        'Fired when a user without a connected device taps the "Get Trezor" eShop call-to-action, shown to non-owners (no hardware device, no portfolio-tracker imports). Emitted by both desktop and mobile (suite-native).',
    description:
        'Measures interest in buying a Trezor among users who do not have Trezor device (did not connected any) yet.',
    changelog: [{ version: '26.6.0', notes: 'added to mobile' }],

    attributes: {
        origin: {
            changelog: [{ version: '26.6.0', notes: 'added to mobile' }],
            description: 'Where the CTA was tapped: `dashboard` (home empty state) or `settings`.',
        },
        platform: {
            changelog: [{ version: '26.6.0', notes: 'added to mobile' }],
            description: '`desktop` or `mobile`, identifying which app emitted the event.',
        },
        action: {
            changelog: [{ version: '26.6.0', notes: 'added to mobile' }],
            description:
                'What action was taken: `cta` (clicked the CTA) or `close` (dismissed the banner).',
        },
    },
};
