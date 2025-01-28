import applyFlags from './applyFlags';
import applySettings from './applySettings';
import backupDevice from './backupDevice';
import changeLanguage from './changeLanguage';
import changePin from './changePin';
import changeWipeCode from './changeWipeCode';
import firmwareUpdate from './firmwareUpdate';
import getFeatures from './getFeatures';
import loadDevice from './loadDevice';
import recoverDevice from './recoverDevice';
import resetDevice from './resetDevice';
import wipeDevice from './wipeDevice';

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
