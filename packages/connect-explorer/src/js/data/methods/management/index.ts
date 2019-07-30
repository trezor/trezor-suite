import debugLink from './debugLink';
import getFeatures from './getFeatures';
import resetDevice from './resetDevice';
import wipeDevice from './wipeDevice';
import applyFlags from './applyFlags';
import applySettings from './applySettings';
import backupDevice from './backupDevice';
import changePin from './changePin';
import recoverDevice from './recoverDevice';
import firmwareErase from './firmwareErase';
import firmwareUpdate from './firmwareUpdate';

export default [
    ...debugLink,
    ...getFeatures,
    ...resetDevice,
    ...wipeDevice,
    ...applyFlags,
    ...applySettings,
    ...backupDevice,
    ...changePin,
    ...recoverDevice,
    ...firmwareErase,
    ...firmwareUpdate,
];
