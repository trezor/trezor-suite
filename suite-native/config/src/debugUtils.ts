export const getAppVersion = () => process.env.VERSION || '';

export const getCommitHash = () => process.env.COMMIT_HASH || '';

export const getBuildVersionNumber = () => process.env.BUILD_NUMBER || '';

export const getChangelog = () => process.env.CHANGELOG || '';
