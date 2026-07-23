import { getInitialState, initStore, setupDropboxProviderMock } from './metadataActionsTestUtils';
import * as fixtures from '../__fixtures__/metadataActions';
import { init } from '../metadataLabelingActions/init';

describe(init.name, () => {
    beforeAll(setupDropboxProviderMock);

    fixtures.init.forEach(fixture => {
        it(fixture.description, async () => {
            const store = initStore(getInitialState(fixture.initialState));

            await store.dispatch(init(...fixture.params));

            if (!fixture.result) {
                expect(store.getActions().length).toEqual(0);
            } else {
                expect(store.getActions()).toMatchObject(fixture.result);
            }
        });
    });
});
