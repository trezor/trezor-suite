import { renderWithBasicProvider } from '@suite-native/test-utils';

import { EdgeFades } from './EdgeFades';

describe('EdgeFades', () => {
    it('renders horizontal fades at the left and right edges', () => {
        const { getByTestId } = renderWithBasicProvider(
            <EdgeFades direction="horizontal" startSize={20} endSize={32} testID="edge-fades" />,
        );

        expect(getByTestId('edge-fades/left')).toHaveProp('startPoint', [1, 0.5]);
        expect(getByTestId('edge-fades/left')).toHaveProp('endPoint', [0, 0.5]);
        expect(getByTestId('edge-fades/left')).toHaveStyle({
            top: 0,
            bottom: 0,
            left: 0,
            width: 20,
        });

        expect(getByTestId('edge-fades/right')).toHaveProp('startPoint', [0, 0.5]);
        expect(getByTestId('edge-fades/right')).toHaveProp('endPoint', [1, 0.5]);
        expect(getByTestId('edge-fades/right')).toHaveStyle({
            top: 0,
            right: 0,
            bottom: 0,
            width: 32,
        });
    });

    it('renders vertical fades at the top and bottom edges', () => {
        const { getByTestId } = renderWithBasicProvider(
            <EdgeFades direction="vertical" startSize={24} endSize={40} testID="edge-fades" />,
        );

        expect(getByTestId('edge-fades/top')).toHaveProp('startPoint', [0.5, 1]);
        expect(getByTestId('edge-fades/top')).toHaveProp('endPoint', [0.5, 0]);
        expect(getByTestId('edge-fades/top')).toHaveStyle({
            top: 0,
            right: 0,
            left: 0,
            height: 24,
        });

        expect(getByTestId('edge-fades/bottom')).toHaveProp('startPoint', [0.5, 0]);
        expect(getByTestId('edge-fades/bottom')).toHaveProp('endPoint', [0.5, 1]);
        expect(getByTestId('edge-fades/bottom')).toHaveStyle({
            right: 0,
            bottom: 0,
            left: 0,
            height: 40,
        });
    });
});
