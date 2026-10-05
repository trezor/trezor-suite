import { prepareSuiteSettingsReducer, suiteSettingsInitialState } from '@suite/settings';

import { STORAGE } from 'src/actions/suite/constants';
import { type StorageLoadAction } from 'src/actions/suite/storageActions';
import { extraDependencies } from 'src/support/extraDependencies';

const suiteSettingsReducer = prepareSuiteSettingsReducer(extraDependencies);

const loadSuiteSettings = (storedSettings: Record<string, unknown>) =>
    suiteSettingsReducer(suiteSettingsInitialState, {
        type: STORAGE.LOAD,
        payload: {
            suiteSettings: { settings: { ...suiteSettingsInitialState, ...storedSettings } },
        },
    } as StorageLoadAction);

describe('storageLoadSuiteSettings', () => {
    it('validates the stored contacts relay URLs', () => {
        const settings = loadSuiteSettings({
            contactsRelayUrls: [
                'wss://relay.example.com',
                'ws://relay.example.com',
                'wss://relay.example.com/',
                'wss://relay.example.com/?auth=secret',
                42,
            ],
        });

        expect(settings.contactsRelayUrls).toEqual(['wss://relay.example.com']);
    });

    it('keeps the default contacts relay list when the stored settings have none', () => {
        const settings = loadSuiteSettings({ contactsRelayUrls: undefined });

        expect(settings.contactsRelayUrls).toEqual(suiteSettingsInitialState.contactsRelayUrls);
    });
});
