import type SuiteDB from '@trezor/suite-storage';

import type { SuiteDBSchema } from './definitions';

export type Db = SuiteDB<SuiteDBSchema>;

export type DbDep = { db: Db };

export const injectDb = (services: any): DbDep => ({ db: services.db });
