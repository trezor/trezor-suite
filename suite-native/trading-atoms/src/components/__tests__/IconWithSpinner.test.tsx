import { renderWithBasicProvider } from '@suite-native/test-utils';

import { IconWithSpinner, type IconWithSpinnerProps } from '../IconWithSpinner';

describe('IconWithSpinner', () => {
    const renderIconWithSpinner = (props: Partial<IconWithSpinnerProps> = {}) =>
        renderWithBasicProvider(<IconWithSpinner iconName="check" {...props} />);

    it('should render spinner when isInProgress is true by default', () => {
        const { getByTestId } = renderIconWithSpinner();

        expect(getByTestId('@circular-spinner')).toBeOnTheScreen();
    });

    it('should not render spinner when isInProgress is false', () => {
        const { queryByTestId } = renderIconWithSpinner({ isInProgress: false });

        expect(queryByTestId('@circular-spinner')).toBeNull();
    });

    it('should render spinner when isInProgress is explicitly true', () => {
        const { getByTestId } = renderIconWithSpinner({ isInProgress: true });

        expect(getByTestId('@circular-spinner')).toBeOnTheScreen();
    });
});
