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

export const formatObjectToJson = async (value: any, stringifySpaces?: number) => {
    const prettierConfig = await getPrettierConfig();
    try {
        return prettier.format(
            JSON.stringify(value, null, stringifySpaces).replace(/\\\\/g, '/'),
            prettierConfig,
        );
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};
