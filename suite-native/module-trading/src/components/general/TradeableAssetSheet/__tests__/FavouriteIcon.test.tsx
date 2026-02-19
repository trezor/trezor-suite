import { fireEvent, renderWithBasicProvider } from '@suite-native/test-utils';

import { FavouriteIcon } from '../FavouriteIcon';

describe('FavouriteIcon', () => {
    it('should have correct hint when marked as favourite', () => {
        const { getByA11yHint } = renderWithBasicProvider(
            <FavouriteIcon isFavourite={true} onPress={jest.fn()} />,
        );
        expect(getByA11yHint('Remove from favourites')).toBeTruthy();
    });

    it('should have correct hint when not marked as favourite', () => {
        const { getByA11yHint } = renderWithBasicProvider(
            <FavouriteIcon isFavourite={false} onPress={jest.fn()} />,
        );
        expect(getByA11yHint('Add to favourites')).toBeTruthy();
    });

    it('should call onPress callback', () => {
        const pressSpy = jest.fn();
        const { getByA11yHint } = renderWithBasicProvider(
            <FavouriteIcon isFavourite={false} onPress={pressSpy} />,
        );

        const button = getByA11yHint('Add to favourites');
        fireEvent.press(button);

        expect(pressSpy).toHaveBeenCalledWith();
    });
});
