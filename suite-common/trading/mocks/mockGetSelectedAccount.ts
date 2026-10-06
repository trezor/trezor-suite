import { type LoadInitialDataThunkDeps } from '../src/thunks/common/loadInitialDataThunk';

export const mockGetSelectedAccount =
    (): LoadInitialDataThunkDeps['services']['getSelectedAccount'] => () => ({ status: 'none' });
