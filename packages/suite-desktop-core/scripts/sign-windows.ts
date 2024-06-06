/* eslint-disable */
exports.default = async function (configuration) {
    // Check if IS_CODESIGN_BUILD is set and true
    if (!process.env.IS_CODESIGN_BUILD || process.env.IS_CODESIGN_BUILD.toLowerCase() !== 'true') {
        console.log('This is DEV build, not signing');
        return;
    }
    // do not include passwords or other sensitive data in the file
    // rather create environment variables with sensitive data
    const CERTIFICATE_NAME = process.env.WINDOWS_SIGN_CERTIFICATE_NAME;
    const TOKEN_PASSWORD = process.env.WINDOWS_SIGN_TOKEN_PASSWORD;

    require('child_process').execSync(
        `java -jar ../suite-desktop-core/scripts/jsign-6.0.jar --keystore ../suite-desktop-core/scripts/hardwareToken.cfg --storepass '${TOKEN_PASSWORD}' --storetype PKCS11 --tsaurl http://timestamp.digicert.com --alias "${CERTIFICATE_NAME}" "${configuration.path}"`,
        {
            stdio: 'inherit',
        },
    );
};
