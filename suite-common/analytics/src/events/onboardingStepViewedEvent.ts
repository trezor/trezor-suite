import { EventType } from '../constants';
import type { AnalyticsPlatform, AttributeDef, EventDef } from '../eventDefinition';

// `security-check` and `thp-pairing` are mobile-only; the rest fire on both platforms.
export type DeviceOnboardingStepName =
    | 'firmware'
    | 'authenticate-device'
    | 'tutorial'
    | 'create-or-recover'
    | 'backup-type'
    | 'recovery'
    | 'security'
    | 'set-pin'
    | 'final'
    | 'security-check'
    | 'thp-pairing';

type Attributes = {
    stepName: AttributeDef<DeviceOnboardingStepName>;
    stepIndex: AttributeDef<number>;
    platform: AttributeDef<AnalyticsPlatform>;
};

export const onboardingStepViewedEvent: EventDef<Attributes, EventType.OnboardingStepViewed> = {
    name: EventType.OnboardingStepViewed,
    descriptionTrigger:
        'Fired once when an onboarding step screen is entered. Re-fires on re-entry (e.g. user navigates back and forward), not on re-render. Emitted by both desktop and mobile (suite-native).',
    description: `Drives the onboarding funnel — every onboarding step the user lands on during initial device setup produces exactly one event. Steps are model-gated and path-gated (create-new-wallet vs. recover-existing-seed), so not all fire in every session. \`stepName\` is the stable, cross-platform identifier used to build a comparable funnel across platforms; some steps are platform-specific (see below).`,
    changelog: [{ version: '26.6.1', notes: 'added' }],

    attributes: {
        stepName: {
            changelog: [{ version: '26.6.1', notes: 'added' }],
            description: `Identifier of the onboarding step entered. Stable and non-localized. One of:

- \`security-check\` — **Mobile only.** Pre-flow device security/authenticity self-check. Has no desktop screen.
- \`thp-pairing\` — **Mobile only.** Trezor Hardware Platform pairing flow. Has no desktop screen.
- \`firmware\` — Firmware installation / update. Shown whenever the connected device needs firmware work; otherwise the user is sent past it.
- \`authenticate-device\` — Device authenticity (attestation) check. Only fires on models with Optiga (e.g. T2B1, T3B1, T3T1, T3W1). Older models skip it.
- \`tutorial\` — On-device tutorial walkthrough. Model/firmware-gated.
- \`create-or-recover\` — User picks between *create new wallet* and *recover existing seed*. This choice branches the rest of the funnel.
- \`backup-type\` — Pick the backup format. **Create-new-wallet path only.**
- \`recovery\` — Seed-recovery flow. **Recover-existing-seed path only.**
- \`security\` — Wallet creation + backup on device. Fires on both paths.
- \`set-pin\` — PIN setup. Fires on both paths.
- \`final\` — Onboarding success screen. Fires on both paths.`,
        },
        stepIndex: {
            changelog: [{ version: '26.6.1', notes: 'added' }],
            description:
                '1-based ordinal of the step on that platform’s own happy path. Each platform has different number of steps. So use `stepName` — not `stepIndex` — to compare/overlay funnels across platforms!',
        },
        platform: {
            changelog: [{ version: '26.6.1', notes: 'added' }],
            description: '`desktop` or `mobile`, identifying which app emitted the step view.',
        },
    },
};
