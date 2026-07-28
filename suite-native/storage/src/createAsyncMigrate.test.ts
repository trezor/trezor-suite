import { createAsyncMigrate } from './createAsyncMigrate';

describe('createAsyncMigrate', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Mock console methods to avoid noise in test output
        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('empty state handling', () => {
        const emptyPersistedState = {
            _persist: { rehydrated: true, version: -1 },
        };
        it('should return empty persisted state when oldState is null and no migration for version 1', async () => {
            const migrations = {};
            const migrate = createAsyncMigrate(migrations);
            // @ts-expect-error
            const result = await migrate(null, 0);

            expect(result).toEqual(emptyPersistedState);
        });

        it('should run migration when oldState is null and migration for version 1 exists', async () => {
            const mockMigration = jest.fn().mockResolvedValue({ migrated: true });
            const migrations = {
                '1': mockMigration,
            };
            const migrate = createAsyncMigrate(migrations);
            // @ts-expect-error
            const result = await migrate(null, 1);

            expect(mockMigration).toHaveBeenCalledWith(emptyPersistedState);
            expect(result).toEqual({ migrated: true });
        });
    });

    describe('version matching', () => {
        it('should return state unchanged when inbound version equals current version', async () => {
            const oldState = {
                data: 'test',
                _persist: { version: 2, rehydrated: false },
            };
            const migrations = {};
            const migrate = createAsyncMigrate(migrations);
            const result = await migrate(oldState, 2);

            expect(result).toEqual(oldState);
        });

        it('should migrate even when _persist.version is undefined', async () => {
            const oldState = {
                data: 'test',
            };
            const mockMigration = jest.fn().mockResolvedValue({ data: 'migrated-test' });
            const migrations = {
                '1': mockMigration,
            };
            const migrate = createAsyncMigrate(migrations);
            // @ts-expect-error
            const result = await migrate(oldState, 3);
            expect(mockMigration).toHaveBeenCalledWith(oldState);

            expect(result).toEqual({ data: 'migrated-test' });
        });
    });

    describe('downgrade handling', () => {
        it('should return state unchanged when inbound version is greater than current version', async () => {
            const oldState = {
                data: 'test',
                _persist: { version: 5, rehydrated: false },
            };
            const migrations = {};
            const migrate = createAsyncMigrate(migrations);
            const result = await migrate(oldState, 3);

            expect(result).toEqual(oldState);
        });
    });

    describe('sequential migrations', () => {
        it('should run migrations in order when multiple versions need migration', async () => {
            const migration2 = jest.fn().mockImplementation(state => ({
                ...state,
                migrated2: true,
            }));
            const migration3 = jest.fn().mockImplementation(state => ({
                ...state,
                migrated3: true,
            }));
            const migration4 = jest.fn().mockImplementation(state => ({
                ...state,
                migrated4: true,
            }));

            const migrations = {
                '2': migration2,
                '3': migration3,
                '4': migration4,
            };

            const oldState = {
                data: 'test',
                _persist: { version: 1, rehydrated: false },
            };

            const migrate = createAsyncMigrate(migrations);
            const result = await migrate(oldState, 4);

            expect(migration2).toHaveBeenCalledWith(oldState);
            expect(migration3).toHaveBeenCalledWith({
                ...oldState,
                migrated2: true,
            });
            expect(migration4).toHaveBeenCalledWith({
                ...oldState,
                migrated2: true,
                migrated3: true,
            });

            expect(result).toEqual({
                ...oldState,
                migrated2: true,
                migrated3: true,
                migrated4: true,
            });
        });

        it('should only run migrations between inbound version and current version', async () => {
            const migration2 = jest.fn().mockImplementation(state => ({
                ...state,
                migrated2: true,
            }));
            const migration3 = jest.fn().mockImplementation(state => ({
                ...state,
                migrated3: true,
            }));
            const migration4 = jest.fn().mockImplementation(state => ({
                ...state,
                migrated4: true,
            }));

            const migrations = {
                '2': migration2,
                '3': migration3,
                '4': migration4,
            };

            const oldState = {
                data: 'test',
                _persist: { version: 2, rehydrated: false },
            };

            const migrate = createAsyncMigrate(migrations);
            const result = await migrate(oldState, 4);

            expect(migration2).not.toHaveBeenCalled();
            expect(migration3).toHaveBeenCalledWith(oldState);
            expect(migration4).toHaveBeenCalledWith({
                ...oldState,
                migrated3: true,
            });

            expect(result).toEqual({
                ...oldState,
                migrated3: true,
                migrated4: true,
            });
        });
    });

    describe('async migrations', () => {
        it('should handle async migrations correctly', async () => {
            const asyncMigration = jest.fn().mockResolvedValue({
                migrated: true,
                async: true,
            });

            const migrations = {
                '2': asyncMigration,
            };

            const oldState = {
                data: 'test',
                _persist: { version: 1, rehydrated: false },
            };

            const migrate = createAsyncMigrate(migrations);
            const result = await migrate(oldState, 2);

            expect(asyncMigration).toHaveBeenCalledWith(oldState);
            expect(result).toEqual({
                migrated: true,
                async: true,
            });
        });

        it('should handle mixed sync and async migrations', async () => {
            const syncMigration = jest.fn().mockImplementation(state => ({
                ...state,
                sync: true,
            }));
            const asyncMigration = jest.fn().mockResolvedValue({
                migrated: true,
                async: true,
            });

            const migrations = {
                '2': syncMigration,
                '3': asyncMigration,
            };

            const oldState = {
                data: 'test',
                _persist: { version: 1, rehydrated: false },
            };

            const migrate = createAsyncMigrate(migrations);
            const result = await migrate(oldState, 3);

            expect(syncMigration).toHaveBeenCalledWith(oldState);
            expect(asyncMigration).toHaveBeenCalledWith({
                ...oldState,
                sync: true,
            });
            expect(result).toEqual({
                migrated: true,
                async: true,
            });
        });
    });

    describe('migration returning undefined', () => {
        it('should handle migration returning undefined', async () => {
            const migration = jest.fn().mockReturnValue(undefined);

            const migrations = {
                '2': migration,
            };

            const oldState = {
                data: 'test',
                _persist: { version: 1, rehydrated: false },
            };

            const migrate = createAsyncMigrate(migrations);
            const result = await migrate(oldState, 2);

            expect(migration).toHaveBeenCalledWith(oldState);
            expect(result).toBeUndefined();
        });

        it('should handle async migration resolving to undefined', async () => {
            const migration = jest.fn().mockResolvedValue(undefined);

            const migrations = {
                '2': migration,
            };

            const oldState = {
                data: 'test',
                _persist: { version: 1, rehydrated: false },
            };

            const migrate = createAsyncMigrate(migrations);
            const result = await migrate(oldState, 2);

            expect(migration).toHaveBeenCalledWith(oldState);
            expect(result).toBeUndefined();
        });
    });

    describe('error handling', () => {
        it('should reject when migration throws an error', async () => {
            const error = new Error('Migration failed');
            const migration = jest.fn().mockImplementation(() => {
                throw error;
            });

            const migrations = {
                '2': migration,
            };

            const oldState = {
                data: 'test',
                _persist: { version: 1, rehydrated: false },
            };

            const migrate = createAsyncMigrate(migrations);

            await expect(migrate(oldState, 2)).rejects.toThrow('Migration failed');
            expect(console.error).toHaveBeenCalledWith(error);
        });

        it('should reject when async migration rejects', async () => {
            const error = new Error('Async migration failed');
            const migration = jest.fn().mockRejectedValue(error);

            const migrations = {
                '2': migration,
            };

            const oldState = {
                data: 'test',
                _persist: { version: 1, rehydrated: false },
            };

            const migrate = createAsyncMigrate(migrations);

            await expect(migrate(oldState, 2)).rejects.toThrow('Async migration failed');
            expect(console.error).toHaveBeenCalledWith(error);
        });

        it('should stop migration chain when error occurs', async () => {
            const migration2 = jest.fn().mockImplementation(state => ({
                ...state,
                migrated2: true,
            }));
            const migration3 = jest.fn().mockImplementation(() => {
                throw new Error('Migration 3 failed');
            });
            const migration4 = jest.fn().mockImplementation(state => ({
                ...state,
                migrated4: true,
            }));

            const migrations = {
                '2': migration2,
                '3': migration3,
                '4': migration4,
            };

            const oldState = {
                data: 'test',
                _persist: { version: 1, rehydrated: false },
            };

            const migrate = createAsyncMigrate(migrations);

            await expect(migrate(oldState, 4)).rejects.toThrow('Migration 3 failed');
            expect(migration2).toHaveBeenCalled();
            expect(migration3).toHaveBeenCalled();
            expect(migration4).not.toHaveBeenCalled();
        });
    });
});
