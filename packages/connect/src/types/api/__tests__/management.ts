import { TrezorConnect } from '../../..';

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
        display_rotation: 180,
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
        fwBinary.payload.challenge.toLowerCase();
        fwBinary.payload.hash.toLowerCase();
    }

    const fwAuto = await api.firmwareUpdate({
        version: [2, 2, 0],
        btcOnly: false,
    });
    if (fwAuto.success) {
        fwAuto.payload.challenge.toLowerCase();
        fwAuto.payload.hash.toLowerCase();
    }

    api.firmwareUpdate({
        binary: new ArrayBuffer(0),
        // @ts-expect-error: cannot use both
        version: [2, 2, 0],
    });

    const recovery = await api.recoveryDevice({
        passphrase_protection: true,
        pin_protection: true,
        label: 'My Trezor',
        type: 1,
        dry_run: true,
        word_count: 24,
    });
    if (recovery.success) recovery.payload.message.toLowerCase();

    const reboot = await api.rebootToBootloader();
    if (reboot.success) reboot.payload.message.toLowerCase();
};
