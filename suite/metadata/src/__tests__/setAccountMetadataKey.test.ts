import { getInitialState, initStore } from './metadataActionsTestUtils';
import * as fixtures from '../__fixtures__/metadataActions';
import { setAccountMetadataKey } from '../metadataLabelingActions/setAccountMetadataKey';

describe(setAccountMetadataKey.name, () => {
    fixtures.setAccountMetadataKey.forEach(fixture => {
        it(fixture.description, () => {
            const store = initStore(getInitialState(fixture.initialState));

            const account = store.dispatch(setAccountMetadataKey(...fixture.params));

            expect(account).toMatchObject(fixture.result);
        });
    });
});
