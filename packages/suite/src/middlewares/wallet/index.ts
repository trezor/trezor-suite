import CoingeckoService from '@wallet-services/CoingeckoService';
import firstMiddlware from './firstMiddleware';
import persistentStorageMiddleware from './persistentStorageMiddleware';

export default [firstMiddlware, CoingeckoService, persistentStorageMiddleware];
