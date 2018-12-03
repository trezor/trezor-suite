import Version from './Version';

/**
 * Helper class, telling all info about concrete firmware
 */

export default class FirmwareInfo {
    constructor(o) {
        this.required = o.required;
        this.url = o.url;
        this.prefilledData = o.prefilledData;
        this.fingerprint = o.fingerprint.toLowerCase();
        this.changelog = o.changelog;
        this.notes = o.notes;
        this.min_bridge_version = Version.fromArray(o.min_bridge_version);
        this.min_bootloader_version = Version.fromArray(o.min_bootloader_version);
        this.min_firmware_version = Version.fromArray(o.min_firmware_version);
        this.version = Version.fromArray(o.version);
        this.rollout = o.rollout;
        if (o.bootloader_version) {
            this.bootloader_version = Version.fromArray(o.bootloader_version);
        }
    }

    get isCustom() {
        return !!this.prefilledData;
    }
}
