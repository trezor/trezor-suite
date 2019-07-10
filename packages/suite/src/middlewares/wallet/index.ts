import CoingeckoService from '@wallet-services/CoingeckoService';
import firstMiddlware from './firstMiddleware';

export default [firstMiddlware, CoingeckoService];
