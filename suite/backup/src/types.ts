import type TrezorConnect from '@trezor/connect';

export type ConfirmKey =
    | 'has-enough-time'
    | 'is-in-private'
    | 'understands-what-seed-is'
    | 'wrote-seed-properly'
    | 'made-no-digital-copy'
    | 'will-hide-seed';

export type BackupStatus = 'initial' | 'in-progress' | 'finished' | 'error';

export type BackupDeviceParams = Parameters<typeof TrezorConnect.backupDevice>[0];
