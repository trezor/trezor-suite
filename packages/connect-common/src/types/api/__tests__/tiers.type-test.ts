// Negative type tests: the public tier must not expose management or internal members.

import type { TrezorConnectPrivilegedAPI, TrezorConnectPublicAPI } from '../../..';
import type { TrezorConnectInternal } from '../internal';
import type { TrezorConnectManagement } from '../management';

type AssertNever<T extends never> = T;

type PublicApiKeys = keyof TrezorConnectPublicAPI<Record<string, any>>;

declare const publicApiHasNoManagementMethods: AssertNever<
    Extract<PublicApiKeys, keyof TrezorConnectManagement>
>;
declare const publicApiHasNoInternalMembers: AssertNever<
    Extract<PublicApiKeys, keyof TrezorConnectInternal>
>;

// The privileged tier keeps both groups.
const privileged = (api: TrezorConnectPrivilegedAPI) => {
    const { on, off, removeAllListeners, uiResponse, updateConnectSettings, wipeDevice } = api;

    return { on, off, removeAllListeners, uiResponse, updateConnectSettings, wipeDevice };
};

void publicApiHasNoManagementMethods;
void publicApiHasNoInternalMembers;
void privileged;
