import { FirmwareRevisionCheckError } from '@trezor/connect';

/*
 * Various scenarios how firmware authenticity check errors are handled in Suite Lite
 * see packages/suite/src/constants/suite/firmware.ts for Suite
 */

// display a warning banner
type SoftWarningBehavior = { type: 'softWarning'; shouldReport: boolean };
// display "Device Compromised" modal, after closing it dispaly a warning banner, block receiving address
type HardModalBehavior = { type: 'hardModal'; shouldReport: true };

type RevisionErrorBehavior = SoftWarningBehavior | HardModalBehavior;
type RevisionCheckErrorScenarios = Record<FirmwareRevisionCheckError, RevisionErrorBehavior>;

export const revisionCheckErrorScenarios = {
    'revision-mismatch': { type: 'hardModal', shouldReport: true },
    'firmware-version-unknown': { type: 'hardModal', shouldReport: true },
    'cannot-perform-check-offline': { type: 'softWarning', shouldReport: false },
    'other-error': { type: 'softWarning', shouldReport: true },
} satisfies RevisionCheckErrorScenarios;
