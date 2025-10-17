import { fireEvent, renderWithBasicProvider } from '@suite-native/test-utils';

import { SkipButton, SkipButtonProps } from '../SkipButton';

describe('SkipButton', () => {
    const renderSkipButton = (props: SkipButtonProps) =>
        renderWithBasicProvider(<SkipButton {...props} />);

    it('should call onPress callback when pressed', () => {
        const onPressMock = jest.fn();

        const { getByText } = renderSkipButton({ onPress: onPressMock });
        fireEvent.press(getByText('Not now'));

        expect(onPressMock).toHaveBeenCalled();
    });
});
