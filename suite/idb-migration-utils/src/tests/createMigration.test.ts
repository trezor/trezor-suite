import { createMigration } from '../createMigration';

describe('createMigration', () => {
    it('returns correct threshold', () => {
        const migrateFn = jest.fn();
        expect(createMigration('0.0.1', migrateFn)).toEqual({
            threshold: 0x000001,
            migrate: migrateFn,
        });
    });

    it('calls the callback with correct params', () => {
        const migrateFn = jest.fn();
        const migration = createMigration('1.2.3', migrateFn);

        migration.migrate('db' as any, 'tx' as any);
        expect(migrateFn).toHaveBeenCalledWith('db', 'tx');
    });
});
