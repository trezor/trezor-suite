import { fireEvent, renderWithBasicProvider } from '@suite-native/test-utils';

import { SimpleSheetHeader, SimpleSheetHeaderProps } from '../SimpleSheetHeader';

describe('SimpleSheetHeader', () => {
    const renderSimpleSheetHeader = (props: SimpleSheetHeaderProps) =>
        renderWithBasicProvider(<SimpleSheetHeader {...props} />);

    it('should render title', () => {
        const { getByText } = renderSimpleSheetHeader({
            title: 'Test title',
            onClose: jest.fn(),
        });

        expect(getByText('Test title')).toBeTruthy();
    });
    it('should call onClose when X button is pressed', () => {
        const onCloseMock = jest.fn();
        const { getByLabelText } = renderSimpleSheetHeader({
            title: 'Test title',
            onClose: onCloseMock,
        });

        const closeButton = getByLabelText('Close');
        fireEvent.press(closeButton);

        expect(onCloseMock).toHaveBeenCalledTimes(1);
    });
});
