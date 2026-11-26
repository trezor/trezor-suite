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
