import prettier from 'prettier';

// resolveConfig resolves overrides based on the file path passed to it.
// Here we pass the config file path (not a tsconfig path), so tsconfig-specific
// overrides from .prettierrc (like printWidth: 50) won't apply automatically.
// We hardcode them here to stay in sync with the .prettierrc tsconfig override.
export const getPrettierConfig = async () => {
    const prettierConfigPath = await prettier.resolveConfigFile();
    const prettierConfig = {
        ...(await prettier.resolveConfig(prettierConfigPath!)),
        parser: 'json',
        printWidth: 50,
    };

    return prettierConfig;
};
