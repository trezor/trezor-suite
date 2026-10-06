import { type GetTradingEnvironment } from '../src/thunks/common/loadInitialDataThunk';

export const mockGetTradingEnvironment = (): GetTradingEnvironment => () => 'localhost';
