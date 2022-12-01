import Config from 'react-native-config';

export const getAppVersion = () => Config.VERSION || '';

export const getCommitHash = () => Config.COMMIT_HASH || '';

export const getBuildVersionNumber = () => Config.BUILD_NUMBER || '';

export const getChangelog = () => Config.CHANGELOG || '';
