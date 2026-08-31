import { useSelector as useReduxSelector } from 'react-redux';

import { shallowEqual, useSelector } from './useSelector';

jest.mock('react-redux', () => ({
    shallowEqual: jest.fn(),
    useSelector: jest.fn(),
}));

const mockedUseReduxSelector = jest.mocked(useReduxSelector);

describe(useSelector.name, () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('uses shallow equality by default', () => {
        const selector = () => 'value';

        useSelector(selector);

        expect(mockedUseReduxSelector).toHaveBeenCalledWith(selector, shallowEqual);
    });

    it('keeps an explicitly provided equality function', () => {
        const selector = () => 'value';
        const equalityFn = (left: string, right: string) => left === right;

        useSelector(selector, equalityFn);

        expect(mockedUseReduxSelector).toHaveBeenCalledWith(selector, equalityFn);
    });
});
