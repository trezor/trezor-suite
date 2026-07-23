import { getInitialState, initStore } from './metadataActionsTestUtils';
import * as fixtures from '../__fixtures__/metadataActions';
import { setDeviceMetadataKey } from '../metadataLabelingActions/setDeviceMetadataKey';

describe(setDeviceMetadataKey.name, () => {
    fixtures.setDeviceMetadataKey.forEach(fixture => {
        it(fixture.description, async () => {
            const store = initStore(getInitialState(fixture.initialState));

            await store.dispatch(setDeviceMetadataKey(...fixture.params));

            if (!fixture.result) {
                expect(store.getActions().length).toEqual(0);
            } else {
                expect(store.getActions()).toMatchObject(fixture.result);
            }
        });
    });
});
