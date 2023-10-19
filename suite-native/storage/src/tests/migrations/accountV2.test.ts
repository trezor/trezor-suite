import { migrateAccountLabel } from '../../migrations/account/v2';

describe('migrateAccountLabel', () => {
    it('should migrate old accounts without accountLabel to new format', () => {
        const oldAccounts = [
            {
                metadata: {
                    key: 'someKey',
                    fileName: 'file1.txt',
                    aesKey: 'someAesKey',
                    accountLabel: undefined,
                    outputLabels: {},
                    addressLabels: {},
                },
                otherKey: 'otherValue',
            },
        ];

        const migratedAccounts = migrateAccountLabel(oldAccounts);

        expect(migratedAccounts).toEqual(oldAccounts);
    });

    it('should migrate old accounts with accountLabel to new format', () => {
        const oldAccounts = [
            {
                metadata: {
                    key: 'someKey',
                    fileName: 'file1.txt',
                    aesKey: 'someAesKey',
                    accountLabel: 'Label 1',
                    outputLabels: {},
                    addressLabels: {},
                },
                otherKey: 'otherValue',
            },
            {
                metadata: {
                    key: 'anotherKey',
                    fileName: 'file2.txt',
                    aesKey: 'anotherAesKey',
                    accountLabel: 'Label 2',
                    outputLabels: {},
                    addressLabels: {},
                },
                otherKey: 'otherValue',
            },
        ];

        const migratedAccounts = migrateAccountLabel(oldAccounts);

        expect(migratedAccounts).toEqual([
            {
                accountLabel: 'Label 1',
                metadata: {
                    key: 'someKey',
                    fileName: 'file1.txt',
                    aesKey: 'someAesKey',
                    outputLabels: {},
                    addressLabels: {},
                },
                otherKey: 'otherValue',
            },
            {
                accountLabel: 'Label 2',
                metadata: {
                    key: 'anotherKey',
                    fileName: 'file2.txt',
                    aesKey: 'anotherAesKey',
                    outputLabels: {},
                    addressLabels: {},
                },
                otherKey: 'otherValue',
            },
        ]);
    });

    it('should not modify accounts that are already in the new format', () => {
        const migratedAccounts = migrateAccountLabel([
            {
                accountLabel: 'Label 1',
                metadata: {
                    key: 'someKey',
                    fileName: 'file1.txt',
                    aesKey: 'someAesKey',
                    outputLabels: {},
                    addressLabels: {},
                },
                otherKey: 'otherValue',
            },
            {
                accountLabel: 'Label 2',
                metadata: {
                    key: 'anotherKey',
                    fileName: 'file2.txt',
                    aesKey: 'anotherAesKey',
                    outputLabels: {},
                    addressLabels: {},
                },
                otherKey: 'otherValue',
            },
        ]);

        expect(migratedAccounts).toEqual([
            {
                accountLabel: 'Label 1',
                metadata: {
                    key: 'someKey',
                    fileName: 'file1.txt',
                    aesKey: 'someAesKey',
                    outputLabels: {},
                    addressLabels: {},
                },
                otherKey: 'otherValue',
            },
            {
                accountLabel: 'Label 2',
                metadata: {
                    key: 'anotherKey',
                    fileName: 'file2.txt',
                    aesKey: 'anotherAesKey',
                    outputLabels: {},
                    addressLabels: {},
                },
                otherKey: 'otherValue',
            },
        ]);
    });
});
