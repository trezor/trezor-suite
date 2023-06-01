import Config from 'react-native-config';

export const getBuildVersionNumber = () => Config.BUILD_NUMBER || '';

export const getChangelog = () => Config.CHANGELOG || '';
