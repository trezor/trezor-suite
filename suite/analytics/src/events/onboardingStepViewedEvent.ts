import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

// Mirror of AnyStepId in packages/suite/src/types/onboarding — kept inline so
// this package stays free of the desktop-app dependency edge. Keep in sync.
type OnboardingStepName =
    | 'firmware'
    | 'authenticate-device'
    | 'tutorial'
    | 'create-or-recover'
    | 'backup-type'
    | 'recovery'
    | 'security'
    | 'set-pin'
    | 'final';

type Attributes = {
    stepName: AttributeDef<OnboardingStepName>;
    stepIndex: AttributeDef<number>;
    platform: AttributeDef<'desktop'>;
};

export const onboardingStepViewedEvent: EventDef<Attributes, EventType.OnboardingStepViewed> = {
    name: EventType.OnboardingStepViewed,
    descriptionTrigger:
        'Fired once when an onboarding step screen is entered. Re-fires on re-entry (e.g. user navigates back and forward), not on re-render. Desktop only.',
    description: `Drives the onboarding funnel — every screen the user lands on during initial device setup produces exactly one event. There are 9 possible steps; not all fire in every session because some are model-gated and some are path-gated (create-new-wallet vs. recover-existing-seed). A given session typically fires 6–8 events.`,
    changelog: [{ version: '26.6.1', notes: 'added' }],

    attributes: {
        stepName: {
            changelog: [{ version: '26.6.1', notes: 'added' }],
            description: `Identifier of the onboarding screen entered. One of:

- \`firmware\` — Firmware installation / update. Shown whenever the connected device needs firmware work; otherwise the user is sent past it.
- \`authenticate-device\` — Device authenticity (attestation) check. Only fires on T2B1, T3B1, T3T1, and T3W1 (models with Optiga). Older models (T1B1, T2T1) skip it.
- \`tutorial\` — On-device tutorial walkthrough. Only fires on T2B1, T3B1, T3T1 (firmware ≥ 2.8.0), and T3W1.
- \`create-or-recover\` — User picks between *create new wallet* and *recover existing seed*. This choice branches the rest of the funnel.
- \`backup-type\` — Pick the backup format (BIP-39 vs. SLIP-39 variants). **Only fired when the user selects *create new wallet*** on \`create-or-recover\`.
- \`recovery\` — Seed-recovery flow. **Only fired when the user selects *recover existing seed*** on \`create-or-recover\`.
- \`security\` — Wallet creation + backup on device (\`resetDevice\` with \`skip_backup: false\`). Fires on both paths.
- \`set-pin\` — PIN setup. Fires on both paths.
- \`final\` — Onboarding success screen. Fires on both paths.`,
        },
        stepIndex: {
            changelog: [{ version: '26.6.1', notes: 'added' }],
            description:
                '1-based ordinal of the step on the happy path (e.g. `firmware` = 1, `final` = 9). Lets consumers sort steps without depending on the string name. Derived from `stepCategories` in `packages/suite/src/config/onboarding/steps.ts` — keep that file as the source of truth.',
        },
        platform: {
            changelog: [{ version: '26.6.1', notes: 'added' }],
            description:
                'Always `desktop`. Onboarding runs only on the desktop app; mobile/native have a separate flow and do not emit this event.',
        },
    },
};
