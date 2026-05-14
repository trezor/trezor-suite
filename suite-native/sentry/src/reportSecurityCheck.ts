import { type ReportSecurityCheckParams } from '@suite-common/suite-types';

import { captureSentryException, withSentryScope } from './sentry';

export const reportSecurityCheck = ({
    level,
    checkType,
    contextData,
    payload,
}: ReportSecurityCheckParams) => {
    const levelDescription = level === 'error' ? 'failed' : 'warning';
    const exceptionName = level === 'error' ? 'reportCheckFail' : 'reportCheckWarning';
    const payloadLabel = `${checkType} check ${levelDescription}!`;

    withSentryScope(scope => {
        scope.setExtra(`${level}Payload`, payload);
        // The only way to do custom issue title is via Error.name
        const exceptionForSentry = new Error(`${payloadLabel} ${JSON.stringify(contextData)}`);
        exceptionForSentry.name = exceptionName;
        captureSentryException(exceptionForSentry, scope);
    });
};
