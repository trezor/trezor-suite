const TRANSLATED_FILE_EXTENSIONS = ['.ts', '.tsx'] as const;

const IGNORED_TRANSLATION_PATHS = [
    'docs',
    'node_modules',
    'lib',
    'libDev',
    'build',
    'build-electron',
    '.next',
    '__fixtures__',
    'fixtures',
    'test',
    'tests',
    '__test__',
    '__tests__',
    'coverage',
    '.git',
    'suite-data',
    'connect-common',
    '.yarn',
    'screenshots',
    'e2e',
] as const;

export const getGrepCommandOfTranslationKey = (message: string) => {
    const includeExtensions = TRANSLATED_FILE_EXTENSIONS.map(
        extension => `--include="*${extension}"`,
    ).join(' ');
    const excludeDir = IGNORED_TRANSLATION_PATHS.map(folder => `--exclude-dir="${folder}"`).join(
        ' ',
    );

    return `grep ${includeExtensions} ${excludeDir} --exclude=messages.ts -r "${message}" -w ./`;
};
