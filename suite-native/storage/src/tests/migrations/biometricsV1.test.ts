import { unecryptedJotaiStorage } from '../../atomWithUnecryptedStorage';
import { migrateBiometricsAtomToRedux } from '../../migrations/biometrics/v1';

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

    it('should migrate false value from storage to Redux state', () => {
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

    it('should not migrate when storage returns undefined', () => {
        const oldState = createPersistedState({ someField: 'value' });
        (unecryptedJotaiStorage.getString as jest.Mock).mockReturnValue(undefined);

        const result = migrateBiometricsAtomToRedux(oldState);

        expect(unecryptedJotaiStorage.getString).toHaveBeenCalledWith(
            LEGACY_BIOMETRICS_ATOM_STORAGE_KEY,
        );
        expect(unecryptedJotaiStorage.remove).not.toHaveBeenCalled();
        expect(result).toEqual(oldState);
    });
});
