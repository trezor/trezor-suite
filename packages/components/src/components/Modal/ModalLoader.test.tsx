import { render } from '@testing-library/react';

import { ModalLoader } from './ModalLoader';

const Throwing = ({ thrown }: { thrown: unknown }) => {
    throw thrown;
};

describe(ModalLoader.name, () => {
    let consoleError: jest.SpyInstance;

    /** React logs every error it catches; the assertions below read the boundary instead. */
    beforeEach(() => {
        consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    });

    afterEach(() => consoleError.mockRestore());

    it.each([
        ['an Error', new Error('chunk failed')],
        /** A boundary keyed on the caught value alone would let this one through. */
        ['null', null],
        ['undefined', undefined],
    ])('catches %s, shows the fallback and reports once', (_label, thrown) => {
        const onError = jest.fn();

        const { queryByText } = render(
            <ModalLoader errorFallback={<p>modal failed</p>} onError={onError}>
                <Throwing thrown={thrown} />
            </ModalLoader>,
        );

        expect(queryByText('modal failed')).not.toBeNull();
        expect(onError).toHaveBeenCalledTimes(1);
    });

    it('hands the caught value to an errorFallback function', () => {
        const thrown = new Error('chunk failed');

        const { queryByText } = render(
            <ModalLoader errorFallback={error => <p>{String(error)}</p>}>
                <Throwing thrown={thrown} />
            </ModalLoader>,
        );

        expect(queryByText('Error: chunk failed')).not.toBeNull();
    });
});
