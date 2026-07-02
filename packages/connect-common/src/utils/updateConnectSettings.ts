import { ERRORS } from '../constants';
import { createErrorMessage } from '../events/core';

// Shared response for implementations (proxy/deeplink/dynamic-fallback) that do
// not support runtime settings updates. Kept here so all host packages return
// an identical error message instead of re-declaring it.
export const createUpdateConnectSettingsUnsupportedMessage = () =>
    Promise.resolve(
        createErrorMessage(
            ERRORS.TypedError(
                'Method_InvalidPackage',
                'updateConnectSettings is not supported in this implementation',
            ),
        ),
    );
