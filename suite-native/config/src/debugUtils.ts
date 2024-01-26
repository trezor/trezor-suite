export const getBuildVersionNumber = () => process.env.EXPO_PUBLIC_BUILD_NUMBER || '';

export const getChangelog = () => process.env.EXPO_PUBLIC_CHANGELOG || '';
