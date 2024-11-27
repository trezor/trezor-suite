import { PROTO, TrezorConnect } from '../../..';

export const management = async (api: TrezorConnect) => {
    const reset = await api.resetDevice({
        strength: 1,
        label: 'My Trezor',
        u2f_counter: 0,
        pin_protection: true,
        passphrase_protection: true,
        skip_backup: false,
        no_backup: false,
        backup_type: 0,
    });
    if (reset.success) reset.payload.message.toLowerCase();

    const wipe = await api.wipeDevice();
    if (wipe.success) wipe.payload.message.toLowerCase();

    const flags = await api.applyFlags({
        flags: 1,
    });
    if (flags.success) flags.payload.message.toLowerCase();

    const settings = await api.applySettings({
        homescreen: 'string',
        display_rotation: 'South',
        use_passphrase: true,
        label: 'My Trezor',
        safety_checks: 'Strict',
    });
    if (settings.success) settings.payload.message.toLowerCase();

    const backup = await api.backupDevice({});
    if (backup.success) backup.payload.message.toLowerCase();

    const pin = await api.changePin({
        remove: true,
    });
    if (pin.success) pin.payload.message.toLowerCase();

    const fwBinary = await api.firmwareUpdate({
        binary: new ArrayBuffer(0),
    });
    if (fwBinary.success) {
        fwBinary.payload.check.toLocaleLowerCase();
    }

    const fwAuto = await api.firmwareUpdate({
        btcOnly: false,
        language: 'en-EN',
        baseUrl: 'https://example.com',
    });

    if (fwAuto.success) {
        fwAuto.payload.check.toLowerCase();
    }

    api.firmwareUpdate({
        binary: new ArrayBuffer(0),
        // @ts-expect-error: cannot use both
        btcOnly: true,
    });

    const recovery = await api.recoveryDevice({
        passphrase_protection: true,
        pin_protection: true,
        label: 'My Trezor',
        input_method: PROTO.RecoveryDeviceInputMethod.Matrix,
        type: PROTO.RecoveryType.DryRun,
        word_count: 24,
    });
    if (recovery.success) recovery.payload.message.toLowerCase();
};
