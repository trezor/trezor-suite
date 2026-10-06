/* eslint-disable no-console */
import { isCodesignBuild } from '@trezor/env-utils';

const XSS_WARNING_HEADLINE = 'STOP!';
const XSS_WARNING_HEADLINE_STYLE =
    'color: #e00000; font-size: 40px; font-weight: 700; line-height: 1.2;';
const XSS_WARNING_TEXT_STYLE = 'font-size: 15px;';
const XSS_WARNING_TEXT = `This is a feature intended for developers.\nIf someone told you to copy and paste something here,\nDO NOT do so unless you fully understand the code – it may be a scam to compromise your wallet and steal your funds.`;

/**
 * Display a warning on using devtools to unsuspecting users.
 * This intentionally lives only in Suite Web, because on Desktop, devtools are by default disabled in codesign build.
 */
export const logXssWarning = () => {
    if (!isCodesignBuild()) return;

    console.log(`%c${XSS_WARNING_HEADLINE}`, XSS_WARNING_HEADLINE_STYLE);
    console.log(`%c${XSS_WARNING_TEXT}`, XSS_WARNING_TEXT_STYLE);
};
