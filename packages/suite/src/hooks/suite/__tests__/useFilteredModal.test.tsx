import { Provider } from 'react-redux';
import { configureStore } from 'src/support/tests/configureStore';
import { render } from '@testing-library/react';
import { useFilteredModal } from '../useFilteredModal';
import { filters, fixtures } from '../__fixtures__/useFilteredModal';
import type { State as ModalState } from 'src/reducers/suite/modalReducer';

const mockStore = configureStore<{ modal: ModalState }, any>();

type Result = ModalState | null;

const Component = ({
    params,
    callback,
}: {
    params: Parameters<typeof useFilteredModal>;
    callback: (res: Result) => void;
}) => {
    const modal = useFilteredModal(...params);
    callback(modal);
    return null;
};

describe('Modal filtering', () => {
    fixtures.forEach(([desc, modal, expected]) => {
        it(desc, () => {
            const store = mockStore({ modal });
            const results: Result[] = [];
            const { unmount } = render(
                <Provider store={store}>
                    {filters.map((params, i) => (
                        <Component key={i} params={params} callback={res => (results[i] = res)} />
                    ))}
                </Provider>,
            );
            expect(results).toEqual(expected.map(success => (success ? modal : null)));
            unmount();
        });
    });
});
