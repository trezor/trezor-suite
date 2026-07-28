import { migrateLocaleTagToAppLocaleCode } from './v2';

describe('migrateLocaleTagToAppLocaleCode', () => {
    it('Should return state as-is when oldState is undefined.', () => {
        expect(migrateLocaleTagToAppLocaleCode(undefined)).toBe(undefined);
    });

    it('Should return state as-is when oldState does not have localeTag.', () => {
        const oldState = {
            systemLocaleCode: 'en-US',
            otherKey: 'otherValue',
            _persist: { version: 1, rehydrated: true },
        };

        const migrated = migrateLocaleTagToAppLocaleCode(oldState);

        expect(migrated).toEqual(oldState);
    });

    it('Should return state as-is when localeTag is not a string.', () => {
        const oldState = {
            localeTag: 123,
            otherKey: 'otherValue',
            _persist: { version: 1, rehydrated: true },
        };

        const migrated = migrateLocaleTagToAppLocaleCode(oldState);

        expect(migrated).toEqual(oldState);
    });

    it('Should migrate localeTag to appLocaleCode when localeTag exists and is a string.', () => {
        const oldState = {
            localeTag: 'cs-CZ',
            otherKey: 'otherValue',
            _persist: { version: 1, rehydrated: true },
        };

        const migrated = migrateLocaleTagToAppLocaleCode(oldState);

        expect(migrated.appLocaleCode).toEqual('cs-CZ');
    });
});
