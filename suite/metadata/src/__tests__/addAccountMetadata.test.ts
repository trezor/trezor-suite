import { getInitialState, initStore, setupDropboxProviderMock } from './metadataActionsTestUtils';
import * as fixtures from '../__fixtures__/metadataActions';
import { addAccountMetadata } from '../metadataLabelingActions/addAccountMetadata';

describe(addAccountMetadata.name, () => {
    beforeAll(setupDropboxProviderMock);

    fixtures.addAccountMetadata.forEach(fixture => {
        it(fixture.description, async () => {
            const store = initStore(getInitialState(fixture.initialState));

            await store.dispatch(addAccountMetadata(...fixture.params));

            const result = store.getActions();
            if (!fixture.result) {
                expect(result.length).toEqual(0);
            } else {
                expect(result).toEqual(fixture.result);
            }
        });
    });
});
