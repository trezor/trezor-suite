import { migrateBiometricsAtomToRedux } from './v1';
import { unecryptedJotaiStorage } from '../../atomWithUnecryptedStorage';

const LEGACY_BIOMETRICS_ATOM_STORAGE_KEY = 'isBiometricsOptionEnabled';

jest.mock('react-native-mmkv', () => ({
    createMMKV: jest.fn(() => ({
        getString: jest.fn(),
        remove: jest.fn(),
    })),
}));

describe('migrate biometrics atom to redux', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    const createPersistedState = (overrides = {}) => ({
        _persist: {
            version: 1,
            rehydrated: true,
        },
        ...overrides,
    });

    it('migrates true value from storage to Redux state', () => {
        const oldState = createPersistedState({ someExistingField: 'value' });
        (unecryptedJotaiStorage.getString as jest.Mock).mockReturnValue('true');

        const result = migrateBiometricsAtomToRedux(oldState);

        expect(unecryptedJotaiStorage.remove).toHaveBeenCalledWith(
            LEGACY_BIOMETRICS_ATOM_STORAGE_KEY,
        );
        expect(result).toEqual({
            ...oldState,
            isBiometricsEnabled: true,
        });
    });

    it('migrates false value from storage to Redux state', () => {
        const oldState = createPersistedState({ someExistingField: 'value' });
        (unecryptedJotaiStorage.getString as jest.Mock).mockReturnValue('false');

        const result = migrateBiometricsAtomToRedux(oldState);

        expect(unecryptedJotaiStorage.getString).toHaveBeenCalledWith(
            LEGACY_BIOMETRICS_ATOM_STORAGE_KEY,
        );
        expect(unecryptedJotaiStorage.remove).toHaveBeenCalledWith(
            LEGACY_BIOMETRICS_ATOM_STORAGE_KEY,
        );
        expect(result).toEqual({
            ...oldState,
            isBiometricsEnabled: false,
        });
    });

    it('does not migrate when storage returns undefined', () => {
        const oldState = createPersistedState({ someField: 'value' });
        (unecryptedJotaiStorage.getString as jest.Mock).mockReturnValue(undefined);

        const result = migrateBiometricsAtomToRedux(oldState);

        expect(unecryptedJotaiStorage.getString).toHaveBeenCalledWith(
            LEGACY_BIOMETRICS_ATOM_STORAGE_KEY,
        );
        expect(unecryptedJotaiStorage.remove).not.toHaveBeenCalled();
        expect(result).toBeUndefined();
    });

    it('does not migrate when storage returns malformed JSON', () => {
        const oldState = createPersistedState();
        (unecryptedJotaiStorage.getString as jest.Mock).mockReturnValue('{not json');

        const result = migrateBiometricsAtomToRedux(oldState);

        expect(unecryptedJotaiStorage.remove).not.toHaveBeenCalled();
        expect(result).toBeUndefined();
    });

    it('does not migrate when stored value is not a boolean', () => {
        const oldState = createPersistedState();
        (unecryptedJotaiStorage.getString as jest.Mock).mockReturnValue('"yes"');

        const result = migrateBiometricsAtomToRedux(oldState);

        expect(unecryptedJotaiStorage.remove).not.toHaveBeenCalled();
        expect(result).toBeUndefined();
    });

    it('does not migrate oldState that is not a PersistedState', () => {
        const oldState = { isBiometricsEnabled: true };

        const result = migrateBiometricsAtomToRedux(oldState);

        expect(unecryptedJotaiStorage.getString).not.toHaveBeenCalled();
        expect(unecryptedJotaiStorage.remove).not.toHaveBeenCalled();
        expect(result).toBeUndefined();
    });
});
