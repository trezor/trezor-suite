import { getInitialState, initStore, setupDropboxProviderMock } from './metadataActionsTestUtils';
import * as fixtures from '../__fixtures__/metadataActions';
import { addDeviceMetadata } from '../metadataLabelingActions/addDeviceMetadata';

describe(addDeviceMetadata.name, () => {
    beforeAll(setupDropboxProviderMock);

    fixtures.addDeviceMetadata.forEach(fixture => {
        it(fixture.description, async () => {
            const store = initStore(getInitialState(fixture.initialState));

            await store.dispatch(addDeviceMetadata(...fixture.params));

            if (!fixture.result) {
                expect(store.getActions().length).toEqual(0);
            }
        });
    });
});
