"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var list_1 = require("./utils/list");
var score_1 = require("./utils/score");
exports.getScore = score_1.getScore;
var version_1 = require("./utils/version");
var getBootloaderVersion = function (_a) {
    var releasesList = _a.releasesList, isInBootloader = _a.isInBootloader, firmwareVersion = _a.firmwareVersion, bootloaderVersion = _a.bootloaderVersion;
    if (isInBootloader) {
        return bootloaderVersion;
    }
    var foundVersion = releasesList.find(function (item) {
        return version_1.default.isEqual(item.version, firmwareVersion);
    });
    if (!foundVersion || !foundVersion.bootloader_version) {
        return null;
    }
    return foundVersion.bootloader_version;
};
var getLatestSafeFw = function (input, score) {
    var isInBootloader = input.isInBootloader, firmwareVersion = input.firmwareVersion, firmwarePresent = input.firmwarePresent;
    var releasesList = input.releasesList;
    var latest = releasesList[0];
    var isNewer;
    if (isInBootloader) {
        var bootloaderVersion = getBootloaderVersion(input);
        releasesList = list_1.filterSafeListByBootloader({ releasesList: releasesList, bootloaderVersion: bootloaderVersion });
        if (releasesList[0] &&
            releasesList[0].bootloader_version &&
            version_1.default.isNewer(releasesList[0].bootloader_version, bootloaderVersion)) {
            isNewer = true;
        }
        else {
            isNewer = null;
        }
    }
    else {
        releasesList = list_1.filterSafeListByFirmware({ releasesList: releasesList, firmwareVersion: firmwareVersion });
        var bootloaderVersion = getBootloaderVersion(input);
        if (bootloaderVersion) {
            releasesList = list_1.filterSafeListByBootloader({ releasesList: releasesList, bootloaderVersion: bootloaderVersion });
        }
        isNewer = true;
    }
    if (!releasesList.length) {
        return null;
    }
    if (firmwarePresent === false) {
        return {
            firmware: releasesList[0],
            isLatest: version_1.default.isEqual(releasesList[0].version, latest.version),
            isRequired: true,
            isNewer: true,
        };
    }
    if (score != null && !Number.isNaN(score)) {
        releasesList = releasesList.filter(function (item) { return score_1.isInProbability(item.rollout, score); });
    }
    if (!releasesList.length) {
        return null;
    }
    return {
        firmware: releasesList[0],
        isLatest: version_1.default.isEqual(releasesList[0].version, latest.version),
        isRequired: releasesList.some(function (item) { return item.required; }),
        isNewer: isNewer,
    };
};
exports.getLatestSafeFw = getLatestSafeFw;
