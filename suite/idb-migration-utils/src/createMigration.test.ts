import { createMigration } from './createMigration';

describe('createMigration', () => {
    it('returns correct threshold', () => {
        const migrateFn = jest.fn();
        expect(createMigration('0.0.1', migrateFn)).toEqual({
            threshold: 0x00000100,
            migrate: migrateFn,
        });
    });

    it('supports max encodable version', () => {
        const migrateFn = jest.fn();
        expect(createMigration('255.255.255.255', migrateFn).threshold).toBe(0xffffffff);
    });

    it('calls the callback with correct params', () => {
        const migrateFn = jest.fn();
        const migration = createMigration('1.2.3', migrateFn);

        expect(migrateFn).not.toHaveBeenCalledWith();
        migration.migrate('db' as any, 'tx' as any);
        expect(migrateFn).toHaveBeenCalledWith('db', 'tx');
    });

    it('treats .0 revision as equivalent to 3-part', () => {
        const migrateFn = jest.fn();
        const a = createMigration('1.2.3', migrateFn).threshold;
        const b = createMigration('1.2.3.0', migrateFn).threshold;
        expect(a).toBe(b);
    });

    it('throws on invalid version string', () => {
        const migrateFn = jest.fn();
        expect(() => createMigration('1.2' as any, migrateFn)).toThrow();
        expect(() => createMigration('1.2.3-alpha' as any, migrateFn)).toThrow();
    });

    it('throws on invalid revision', () => {
        const migrateFn = jest.fn();
        expect(() => createMigration('1.2.3.256' as any, migrateFn)).toThrow();
        expect(() => createMigration('1.2.3.-1' as any, migrateFn)).toThrow();
        expect(() => createMigration('1.2.3.foo' as any, migrateFn)).toThrow();
        expect(() => createMigration('1.2.3.1.1' as any, migrateFn)).toThrow();
    });
});
