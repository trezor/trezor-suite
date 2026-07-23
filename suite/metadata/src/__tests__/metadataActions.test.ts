import { deviceActions } from '@suite-common/device';
import { asWalletDescriptor } from '@trezor/device-utils';

import * as fixtures from '../__fixtures__/metadataActions';
import * as metadataActions from '../metadataActions';
import * as metadataProviderActions from '../metadataProviderThunks';
import * as metadataThunks from '../metadataThunks';
import { getInitialState, initStore, setupDropboxProviderMock } from './metadataActionsTestUtils';

describe('Metadata Actions', () => {
    beforeAll(setupDropboxProviderMock);

    fixtures.connectProvider.forEach(fixture => {
        it(`connectProvider - ${fixture.description}`, async () => {
            const store = initStore(getInitialState(fixture.initialState));

            await store.dispatch(metadataProviderActions.connectProvider(...fixture.params));

            if (!fixture.result) {
                expect(store.getActions().length).toEqual(0);
            } else {
                expect(store.getActions()).toEqual(fixture.result);
            }
        });
    });

    fixtures.enableMetadata.forEach(fixture => {
        it(`enableMetadata - ${fixture.description}`, async () => {
            const store = initStore(getInitialState(fixture.initialState));

            await store.dispatch(metadataActions.enableMetadata());

            if (!fixture.result) {
                expect(store.getActions().length).toEqual(0);
            } else {
                expect(store.getActions()).toMatchObject(fixture.result);
            }
        });
    });

    fixtures.disableMetadata.forEach(fixture => {
        it(`disableMetadata - ${fixture.description}`, async () => {
            const store = initStore(getInitialState(fixture.initialState));

            await store.dispatch(metadataThunks.disableMetadata());

            if (!fixture.result) {
                expect(store.getActions().length).toEqual(0);
            } else {
                expect(store.getActions()).toMatchObject(fixture.result);
            }
        });
    });

    fixtures.disposeMetadata.forEach(fixture => {
        it(`disposeMetadata - ${fixture.description}`, async () => {
            const store = initStore(getInitialState(fixture.initialState));

            await store.dispatch(metadataThunks.disposeMetadata(...fixture.params));

            if (fixture.result) {
                expect(store.getState()).toMatchObject(fixture.result);
            }
        });
    });

    fixtures.disposeMetadataKeys.forEach(fixture => {
        it(`disposeMetadataKeys - ${fixture.description}`, async () => {
            const store = initStore(getInitialState(fixture.initialState));

            await store.dispatch(metadataThunks.disposeMetadataKeys(...fixture.params));

            if (fixture.result) {
                expect(store.getState()).toMatchObject(fixture.result);
            }
        });
    });

    it('marks wallet as migrated after legacy labeling migration succeeds', () => {
        const walletDescriptor = asWalletDescriptor('wallet-descriptor');
        const store = initStore(getInitialState());

        store.dispatch(metadataActions.setLegacyLabelsMigrationForWallet(walletDescriptor));

        expect(store.getState().metadata.hasLegacyLabelsMigrated).toEqual({
            [walletDescriptor]: true,
        });
    });

    it('removes wallet migration flag after wallet is forgotten', () => {
        const forgottenWalletDescriptor = asWalletDescriptor('1stTestnetAddress');
        const otherWalletDescriptor = asWalletDescriptor('other-wallet');
        const store = initStore(getInitialState());

        store.dispatch(
            metadataActions.setLegacyLabelsMigrationForWallet(forgottenWalletDescriptor),
        );
        store.dispatch(metadataActions.setLegacyLabelsMigrationForWallet(otherWalletDescriptor));
        store.dispatch(
            deviceActions.forgetDevice({ device: store.getState().device.selectedDevice }),
        );

        expect(store.getState().metadata.hasLegacyLabelsMigrated).toEqual({
            [otherWalletDescriptor]: true,
        });
    });
});
