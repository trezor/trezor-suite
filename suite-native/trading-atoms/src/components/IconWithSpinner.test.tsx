import { renderWithBasicProvider } from '@suite-native/test-utils';

import { IconWithSpinner, type IconWithSpinnerProps } from './IconWithSpinner';

describe('IconWithSpinner', () => {
    const renderIconWithSpinner = async (props: Partial<IconWithSpinnerProps> = {}) =>
        await renderWithBasicProvider(<IconWithSpinner iconName="check" {...props} />);

    it('should render spinner when isInProgress is true by default', async () => {
        const { getByTestId } = await renderIconWithSpinner();

        expect(getByTestId('@circular-spinner')).toBeOnTheScreen();
    });

    it('should not render spinner when isInProgress is false', async () => {
        const { queryByTestId } = await renderIconWithSpinner({ isInProgress: false });

        expect(queryByTestId('@circular-spinner')).toBeNull();
    });

    it('should render spinner when isInProgress is explicitly true', async () => {
        const { getByTestId } = await renderIconWithSpinner({ isInProgress: true });

        expect(getByTestId('@circular-spinner')).toBeOnTheScreen();
    });
});
