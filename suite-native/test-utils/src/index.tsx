import { BasicProvider } from './BasicProvider';
import { StoreProviderForTests } from './StoreProviderForTests';
import { createRender } from './createRender';

export type { PreloadedState } from '@suite-native/state';

export {
    act,
    cleanup,
    fireEvent,
    renderHook,
    screen,
    waitFor,
    waitForElementToBeRemoved,
} from '@testing-library/react-native';

export const render = createRender(BasicProvider);

export const renderWithStore = createRender(StoreProviderForTests);
