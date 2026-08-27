import { getTranslation } from '@suite-native/intl';
import { fireEvent, renderWithBasicProvider } from '@suite-native/test-utils';

import { SimpleSheetHeader, type SimpleSheetHeaderProps } from './SimpleSheetHeader';

describe('SimpleSheetHeader', () => {
    const renderSimpleSheetHeader = async (props: SimpleSheetHeaderProps) =>
        await renderWithBasicProvider(<SimpleSheetHeader {...props} />);

    it('should render title', async () => {
        const { getByText } = await renderSimpleSheetHeader({
            title: 'Test title',
            onClose: jest.fn(),
        });

        expect(getByText('Test title')).toBeTruthy();
    });
    it('should call onClose when X button is pressed', async () => {
        const onCloseMock = jest.fn();
        const { getByLabelText } = await renderSimpleSheetHeader({
            title: 'Test title',
            onClose: onCloseMock,
        });

        const closeButton = getByLabelText(getTranslation('generic.buttons.close'));
        await fireEvent.press(closeButton);

        expect(onCloseMock).toHaveBeenCalledTimes(1);
    });
});
