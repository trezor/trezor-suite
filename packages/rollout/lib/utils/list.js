"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var version_1 = require("./version");
var filterSafeListByBootloader = function (_a) {
    var releasesList = _a.releasesList, bootloaderVersion = _a.bootloaderVersion;
    return releasesList.filter(function (item) {
        return (!item.min_bootloader_version ||
            version_1.default.isNewerOrEqual(bootloaderVersion, item.min_bootloader_version)) &&
            (!item.bootloader_version ||
                version_1.default.isNewerOrEqual(item.bootloader_version, bootloaderVersion));
    });
};
exports.filterSafeListByBootloader = filterSafeListByBootloader;
var filterSafeListByFirmware = function (_a) {
    var releasesList = _a.releasesList, firmwareVersion = _a.firmwareVersion;
    return releasesList.filter(function (item) {
        return version_1.default.isNewerOrEqual(firmwareVersion, item.min_firmware_version) &&
            version_1.default.isNewer(item.version, firmwareVersion);
    });
};
exports.filterSafeListByFirmware = filterSafeListByFirmware;
