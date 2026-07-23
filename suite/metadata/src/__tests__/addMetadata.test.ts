import { getInitialState, initStore, setupDropboxProviderMock } from './metadataActionsTestUtils';
import * as fixtures from '../__fixtures__/metadataActions';
import { addMetadata } from '../metadataLabelingActions/addMetadata';

describe(addMetadata.name, () => {
    beforeAll(setupDropboxProviderMock);

    fixtures.addMetadata.forEach(fixture => {
        it(fixture.description, async () => {
            const store = initStore(getInitialState(fixture.initialState));

            await store.dispatch(addMetadata(...fixture.params));

            if (!fixture.result) {
                expect(store.getActions().length).toEqual(0);
            } else {
                expect(store.getActions()).toEqual(expect.arrayContaining(fixture.result));
            }
        });
    });
});
