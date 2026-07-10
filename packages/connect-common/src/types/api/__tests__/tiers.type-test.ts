// Negative type tests: the public tier must not expose management or internal members.

import type { TrezorConnectPrivilegedAPI, TrezorConnectPublicAPI } from '../../..';
import type { TrezorConnectInternal } from '../internal';
import type { TrezorConnectManagement } from '../management';

type AssertNever<T extends never> = T;

type PublicApiKeys = keyof TrezorConnectPublicAPI<Record<string, any>>;

export type PublicApiHasNoManagementMethods = AssertNever<
    Extract<PublicApiKeys, keyof TrezorConnectManagement>
>;
export type PublicApiHasNoInternalMembers = AssertNever<
    Extract<PublicApiKeys, keyof TrezorConnectInternal>
>;

// The privileged tier keeps both groups.
export const privileged = (api: TrezorConnectPrivilegedAPI) => {
    const { on, off, removeAllListeners, uiResponse, updateConnectSettings, wipeDevice } = api;

    return { on, off, removeAllListeners, uiResponse, updateConnectSettings, wipeDevice };
};
