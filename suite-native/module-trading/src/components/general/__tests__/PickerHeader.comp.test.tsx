import { Text } from '@suite-native/atoms';
import { fireEvent, render } from '@suite-native/test-utils';

import { PickerHeader } from '../PickerHeader';

describe('PickerHeader', () => {
    it('should render without children', () => {
        const { getByText } = render(<PickerHeader title="Title" />);
        expect(getByText('Title')).toBeDefined();
    });

    it('should render with children', () => {
        const { getByText } = render(
            <PickerHeader title="Title">
                <Text>Child</Text>
            </PickerHeader>,
        );
        expect(getByText('Title')).toBeDefined();
        expect(getByText('Child')).toBeDefined();
    });

    it('should render search input when `isSearchInputVisible`', () => {
        const searchInputSpy = jest.fn();
        const { getByPlaceholderText } = render(
            <PickerHeader
                title="Title"
                isSearchInputVisible
                onSearchInputChange={searchInputSpy}
                searchInputPlaceholder="Search placeholder"
            />,
        );
        const searchInput = getByPlaceholderText('Search placeholder');

        fireEvent.changeText(searchInput, 'search');

        expect(searchInputSpy).toHaveBeenCalledWith('search');
    });
});
