import { Suspense } from 'react';

import { act, render, screen } from '@testing-library/react';

import { lazyComponentByName } from './lazyComponentByName';

const moduleUnderTest = {
    Greeting: ({ name }: { name: string }) => <p>Hello {name}</p>,
    /** Structurally a valid `FunctionComponent`: `ReactNode` includes `string`. */
    renderLabel: () => 'not really a component',
    MAX_RETRIES: 2,
};

describe(lazyComponentByName.name, () => {
    it('renders the named export and infers its props', async () => {
        const loaded = Promise.resolve(moduleUnderTest);
        const { LazyComponent } = lazyComponentByName(() => loaded, 'Greeting');

        render(
            <Suspense fallback={<p>loading</p>}>
                <LazyComponent name="Satoshi" />
            </Suspense>,
        );

        expect(screen.queryByText('loading')).not.toBeNull();

        /** A resolving lazy boundary is a state update, so it has to settle inside `act`. */
        await act(async () => {
            await loaded;
        });

        expect(screen.getByText('Hello Satoshi')).not.toBeNull();
    });

    it('awaits the chunk through load, and resolves with the module', async () => {
        const { load } = lazyComponentByName(() => Promise.resolve(moduleUnderTest), 'Greeting');

        await expect(load()).resolves.toBe(moduleUnderTest);
    });

    it('renders a loaded component without suspending', async () => {
        const importModule = jest.fn(() => Promise.resolve(moduleUnderTest));
        const { LazyComponent, load } = lazyComponentByName(importModule, 'Greeting');

        await load();
        render(
            <Suspense fallback={<p>loading</p>}>
                <LazyComponent name="Satoshi" />
            </Suspense>,
        );

        // A suspended render would show the fallback here, because the sync render does not flush promises.
        expect(screen.getByText('Hello Satoshi')).not.toBeNull();
        expect(screen.queryByText('loading')).toBeNull();
        expect(importModule).toHaveBeenCalledTimes(1);
    });

    it('loads the module again after a failed preload', async () => {
        const importModule = jest
            .fn<Promise<typeof moduleUnderTest>, []>()
            .mockRejectedValueOnce(new Error('chunk failed'))
            .mockResolvedValueOnce(moduleUnderTest);
        const { LazyComponent, preload } = lazyComponentByName(importModule, 'Greeting');

        preload();
        render(
            <Suspense fallback={<p>loading</p>}>
                <LazyComponent name="Satoshi" />
            </Suspense>,
        );
        expect(await screen.findByText('Hello Satoshi')).not.toBeNull();
        expect(importModule).toHaveBeenCalledTimes(2);
    });

    it('rejects a name that does not exist, or is not callable', () => {
        // @ts-expect-error there is no such export
        lazyComponentByName(() => Promise.resolve(moduleUnderTest), 'Typo');
        // @ts-expect-error MAX_RETRIES is a number, not a component
        lazyComponentByName(() => Promise.resolve(moduleUnderTest), 'MAX_RETRIES');
    });

    it('rejects props the component does not take', () => {
        const { LazyComponent } = lazyComponentByName(
            () => Promise.resolve(moduleUnderTest),
            'Greeting',
        );

        /** Only the element is built: rendering it would load the module after the test ends. */
        // @ts-expect-error name is a string, not a number
        const wrongProps = <LazyComponent name={42} />;

        expect(wrongProps.props).toEqual({ name: 42 });
    });
});
