import { FirmwareInfo, Version } from 'helpers';

class T1 {
    constructor({ fwVersion, blVersion }) {
        this.common = {
            fw_major: null,
            fw_minor: null,
            fw_patch: null,
        };
        const list = models[1].firmwareList;
        let fwFromList;
        if (blVersion) {
            fwFromList = list.find(fw => fw.bootloader_version
                .isEqual(Version.fromString(blVersion)));
            if (!fwFromList) throw new Error('wrong blVersion param');
            this.internal = {
                fwVersionMajor: null,
                fwVersionMinor: null,
                fwVersionPatch: null,
                blVersionMajor: fwFromList.bootloader_version.major,
                blVersionMinor: fwFromList.bootloader_version.minor,
                blVersionPatch: fwFromList.bootloader_version.patch,
                fwInstalled: false,
                blMode: false,
            };
        } else if (fwVersion) {
            fwFromList = list.find(fw => fw.version.isEqual(Version.fromString(fwVersion)));
            if (!fwFromList) throw new Error('wrong fwVersion param');
            this.internal = {
                fwVersionMajor: fwFromList.version.major,
                fwVersionMinor: fwFromList.version.minor,
                fwVersionPatch: fwFromList.version.patch,
                blVersionMajor: fwFromList.bootloader_version.major,
                blVersionMinor: fwFromList.bootloader_version.minor,
                blVersionPatch: fwFromList.bootloader_version.patch,
                fwInstalled: true,
                blMode: false,
            };
        } else {
            throw new Error('specify either blVersion or fwVersion');
        }
    }

    get features() {
        let features;
        if (this.internal.fwInstalled) {
            if (this.internal.blMode) {
                features = {
                    bootloader_mode: true,
                    firmware_present: true,
                    major_version: this.internal.blVersionMajor,
                    minor_version: this.internal.blVersionMinor,
                    patch_version: this.internal.blVersionPatch,
                };
            } else {
                features = {
                    bootloader_mode: null,
                    firmware_present: null, // no kidding
                    major_version: this.internal.fwVersionMajor,
                    minor_version: this.internal.fwVersionMinor,
                    patch_version: this.internal.fwVersionPatch,
                };
            }
        } else if (this.internal.blMode) {
            features = {
                bootloader_mode: true,
                firmware_present: false,
                major_version: this.internal.blVersionMajor,
                minor_version: this.internal.blVersionMinor,
                patch_version: this.internal.blVersionPatch,
            };
        } else {
            features = {
                bootloader_mode: true, // no kidding
                firmware_present: false,
                major_version: this.internal.blVersionMajor,
                minor_version: this.internal.blVersionMinor,
                patch_version: this.internal.blVersionPatch,
            };
        }
        Object.assign(features, this.common);
        return features;
    }

    set bootloader_mode(val) {
        if (val === true) {
            this.internal.blMode = true;
        } else if (val === false) {
            this.internal.blMode = false;
        } else {
            throw new Error('Wrong value passed to setter');
        }
    }
}

export default T1;
