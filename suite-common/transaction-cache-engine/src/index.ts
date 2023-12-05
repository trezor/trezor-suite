import { TransactionCacheEngine } from './TransactionCacheEngine';
import { MemoryStorage } from './MemoryStorage';

const TransactionCacheEngineInstance = new TransactionCacheEngine({
    storage: new MemoryStorage(),
});

export { TransactionCacheEngineInstance as TransactionCacheEngine };
export type { AccountUniqueParams, AccountBalanceHistory } from './types';
