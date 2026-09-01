import { shallowEqual, useSelector as useReduxSelector } from 'react-redux';

/**
 * @deprecated Selectors should return stable references so React Redux's default equality is
 * sufficient. Import `useSelector` from `react-redux` instead of relying on the `shallowEqual`
 * default provided here.
 */
export const useSelector = <Selected>(
    selector: (state: any) => Selected,
    equalityFn: any = shallowEqual,
): Selected => useReduxSelector(selector, equalityFn);
