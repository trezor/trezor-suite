import { ReactElement } from 'react';

import { render } from '@testing-library/react-native';

import { Provider } from './Provider';

type Parameters<TParams> = TParams extends (...args: infer TParamsInferred) => any
    ? TParamsInferred
    : never;
const nextRender = (
    element: ReactElement,
    options?: Parameters<typeof render>[1],
): ReturnType<typeof render> => render(element, { wrapper: Provider, ...options });

export {
    screen,
    fireEvent,
    cleanup,
    waitFor,
    waitForElementToBeRemoved,
} from '@testing-library/react-native';
export { nextRender as render };
