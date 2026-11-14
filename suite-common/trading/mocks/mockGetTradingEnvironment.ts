import { type GetTradingEnvironment } from '../src/thunks/common/loadTradingCatalogsThunk';

export const mockGetTradingEnvironment = (): GetTradingEnvironment => () => 'localhost';
