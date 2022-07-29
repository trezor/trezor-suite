import { ReactElement } from 'react';

import { render } from '@testing-library/react-native';

import { Provider } from './Provider';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type Parameters<T> = T extends (...args: infer T) => any ? T : never;
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
