import type { connectManagementMethods, connectPublicCallableMethods } from './callableMethods';
import type { CallMethodKeys } from './events/call';
import type { TrezorConnectManagement } from './types/api/management';

type AssertNever<T extends never> = T;

type ManagementKey = keyof TrezorConnectManagement;
type ManagementItem = (typeof connectManagementMethods)[number];
export type ManagementMissingGuard = AssertNever<Exclude<ManagementKey, ManagementItem>>;
export type ManagementExtraGuard = AssertNever<Exclude<ManagementItem, ManagementKey>>;

type PublicKey = Exclude<CallMethodKeys, keyof TrezorConnectManagement>;
type PublicItem = (typeof connectPublicCallableMethods)[number];
export type PublicMissingGuard = AssertNever<Exclude<PublicKey, PublicItem>>;
export type PublicExtraGuard = AssertNever<Exclude<PublicItem, PublicKey>>;
