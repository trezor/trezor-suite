import {
    TestStore,
    fireEvent,
    initStore,
    renderWithStoreProviderAsync,
} from '@suite-native/test-utils';

import { selectTradingResidenceCountry } from '../../selectors/residenceSelectors';
import { ConfirmLocationButton, ConfirmLocationButtonProps } from '../ConfirmLocationButton';
import { LocationForm } from '../LocationForm';

describe('ConfirmLocationButton', () => {
    let store: TestStore;

    const renderConfirmLocationButton = (props: ConfirmLocationButtonProps) =>
        renderWithStoreProviderAsync(<ConfirmLocationButton {...props} />, {
            wrapper: LocationForm,
            store,
        });

    beforeEach(async () => {
        store = await initStore();
    });

    it('should set location and call afterConfirmMock on press', async () => {
        const afterConfirmMock = jest.fn();

        const { getByText } = await renderConfirmLocationButton({ afterConfirm: afterConfirmMock });
        fireEvent.press(getByText('Confirm location'));

        // from expo-localization mock
        expect(selectTradingResidenceCountry(store.getState())).toBe('PL');
        expect(afterConfirmMock).toHaveBeenCalled();
    });
});
