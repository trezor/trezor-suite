import { Version, FirmwareInfo } from './helpers';

class TrezorUpdate {
    constructor({ firmwareList1, firmwareList2 }) {
        this.firmwareList1 = firmwareList1.map(i => new FirmwareInfo(i));
        this.firmwareList2 = firmwareList2.map(i => new FirmwareInfo(i));
    }

    getLatestFw(features) {
        const list = this.getListForModel(features.major_version);
        return list[0];
    }

    getListForModel(model) {
        const int = parseInt(model, 10);
        switch (int) {
        case 1: return this.firmwareList1;
        case 2: return this.firmwareList2;
        default:
            throw new Error('Wrong model param');
        }
    }

    getLatestSafeFw(features) {
        let list = this.getListForModel(features.major_version);

        // 1. handle if no firmware is present at all
        if (features.firmware_present === false) {
            // without firmware, what we see is bootloader version
            const blVersion = new Version(
                features.major_version,
                features.minor_version,
                features.patch_version);
            // incremental safety check. bootloader version must be higher
            // or equal then min_bootloader_version of firmware that is to be installed
            list = list.filter(fw => blVersion.isNewerOrEqual(fw.min_bootloader_version));

            // safeFw here is the highest version of firmware, but its bootloader
            // version must not be lower then current bl version
            const safeFw = list.find(possibleFw => {
                if (possibleFw.min_bootloader_version) {
                    return blVersion.isNewerOrEqual(possibleFw.min_bootloader_version);
                }
                return possibleFw;
            });
            // todo: implement incremental safety check;
            return safeFw
        }

        // 2. handle situation when firmware is already installed

        //-- 2.a if device is connected in bootloader mode

        // todo: tohle je asi to same jako 1. uplne

        if (features.bootloader_mode === true) {
            const blVersion = new Version(
                features.major_version,
                features.minor_version,
                features.patch_version,
            );
            list = list.filter(fw => blVersion.isNewerOrEqual(fw.bootloader_version));
        } else {
        //-- 2.b if device is connected in firmware mode

        // todo: tady je rozdil ten, ze nevidime na t1 verzi bootloader,
        // todo: na t2 sice jo, ale to nestaci, takze musime pouzite min_firmware_version
        }


        return list[0];
    }
}

export default TrezorUpdate;
