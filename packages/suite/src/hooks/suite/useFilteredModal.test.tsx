import { Provider } from 'react-redux';

import { render } from '@testing-library/react';

import type { ModalRootState, State as ModalState } from '@suite/modal';
import { createTestCompositionRoot } from '@suite-common/test-utils';

import { filters, fixtures } from './__fixtures__/useFilteredModal';
import { useFilteredModal } from './useFilteredModal';

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
            const { store } = createTestCompositionRoot<void, ModalRootState>({
                preloadedState: { modal },
            }).services;
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
