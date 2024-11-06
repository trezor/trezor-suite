import getFeatures from './getFeatures';
import resetDevice from './resetDevice';
import loadDevice from './loadDevice';
import wipeDevice from './wipeDevice';
import applyFlags from './applyFlags';
import applySettings from './applySettings';
import backupDevice from './backupDevice';
import changePin from './changePin';
import changeLanguage from './changeLanguage';
import changeWipeCode from './changeWipeCode';
import recoverDevice from './recoverDevice';
import firmwareUpdate from './firmwareUpdate';

export default [
    ...getFeatures,
    ...loadDevice,
    ...resetDevice,
    ...wipeDevice,
    ...applyFlags,
    ...applySettings,
    ...backupDevice,
    ...changeLanguage,
    ...changePin,
    ...changeWipeCode,
    ...recoverDevice,
    ...firmwareUpdate,
];
