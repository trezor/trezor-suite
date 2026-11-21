import { createQueryClient } from '@suite-common/react-query';

import { type LoadInitialDataThunkDeps } from '../src/thunks/common/loadInitialDataThunk';

// A new client per store, so no test reuses a catalog that another test loaded.
export const mockTradingQueryClient = (): LoadInitialDataThunkDeps['services']['queryClient'] =>
    createQueryClient({ shouldRefetchOnEvents: false });
