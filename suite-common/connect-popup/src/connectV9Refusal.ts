import {
    Feature,
    type MessageSystemRootState,
    selectFeatureConfig,
    selectFeatureMessage,
} from '@suite-common/message-system';
import { TrezorError } from '@trezor/connect-common/src/constants/errors';

import { type ConnectCallSource } from './connectPopupTypes';
import { isConnectV9Source } from './connectV9';

const DEFAULT_REFUSAL_MESSAGE =
    'Trezor Suite declined this request from an app that uses Trezor Connect 9. Ask the app developer to update to Trezor Connect 10.';

const hasMessageSystem = (
    state: Partial<MessageSystemRootState>,
): state is MessageSystemRootState => state.messageSystem !== undefined;

/**
 * The text that a call from a Connect 9 app is declined with, or undefined when the call goes on as
 * usual. Calls are declined only while the message-system config has a feature message for
 * `connect.v9.refuse` with flag true. Calls from other apps are never declined here.
 */
export const selectConnectV9RefusalMessage = (
    state: Partial<MessageSystemRootState>,
    source: ConnectCallSource,
): string | undefined => {
    // A store without the message system declines nothing.
    if (!hasMessageSystem(state) || !isConnectV9Source(source)) return undefined;

    // Not selectIsFeatureEnabled: it reads a domain that is missing from the config as enabled.
    const isRefusalEnabled = selectFeatureConfig(state, Feature.connectV9.refuse)?.flag === true;
    if (!isRefusalEnabled) return undefined;

    const featureMessage = selectFeatureMessage(state, Feature.connectV9.refuse);
    // The same text is sent to the app, so it is taken in English.
    const configuredText = featureMessage?.content.en.trim();

    return configuredText || DEFAULT_REFUSAL_MESSAGE;
};

/**
 * Error that a declined call from a Connect 9 app ends with. It is a separate class so that the call
 * thunk can pass it to `refuseConnectV9Call`, which limits the error modal per app, instead of the
 * usual error modal.
 */
export class ConnectV9RefusalError extends TrezorError {
    constructor(message: string) {
        // Method_NotAllowed, not Desktop_ConnectionMissing or Method_Unsupported: on those codes
        // Connect 9 clients stop using Suite and fall back to the Connect popup or iframe (on
        // Method_Unsupported only connect-web from 9.6.3), so the caller would never see this
        // message.
        super('Method_NotAllowed', message);
    }
}

/**
 * App that a declined call came from. Apps are told apart by origin and process, the same way as
 * apps with remembered permissions.
 */
export type ConnectV9RefusalApp = {
    origin: string;
    processPath?: string;
};

export const getConnectV9RefusalApp = ({
    origin,
    process,
}: ConnectCallSource): ConnectV9RefusalApp => ({
    origin,
    processPath: process?.fullPath,
});

export const isSameConnectV9RefusalApp = (
    app: ConnectV9RefusalApp,
    otherApp: ConnectV9RefusalApp,
): boolean => app.origin === otherApp.origin && app.processPath === otherApp.processPath;
