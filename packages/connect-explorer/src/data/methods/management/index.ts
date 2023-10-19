import getFeatures from './getFeatures';
import resetDevice from './resetDevice';
import wipeDevice from './wipeDevice';
import applyFlags from './applyFlags';
import applySettings from './applySettings';
import backupDevice from './backupDevice';
import changePin from './changePin';
import recoverDevice from './recoverDevice';
import firmwareUpdate from './firmwareUpdate';
import rebootToBootloader from './rebootToBootloader';

export default [
    ...getFeatures,
    ...resetDevice,
    ...wipeDevice,
    ...applyFlags,
    ...applySettings,
    ...backupDevice,
    ...changePin,
    ...recoverDevice,
    ...firmwareUpdate,
    ...rebootToBootloader,
];
