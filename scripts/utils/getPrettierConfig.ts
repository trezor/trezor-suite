import prettier from 'prettier';

export const getPrettierConfig = async () => {
    const prettierConfigPath = await prettier.resolveConfigFile();
    const prettierConfig = {
        ...(await prettier.resolveConfig(prettierConfigPath!)),
        parser: 'json',
        printWidth: 50,
    };

    return prettierConfig;
};
