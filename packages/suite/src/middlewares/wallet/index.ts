import discoveryMiddleware from './discoveryMiddleware';
import coingeckoMiddleware from './coingeckoMiddleware';
import persistentStorageMiddleware from './persistentStorageMiddleware';

export default [discoveryMiddleware, coingeckoMiddleware, persistentStorageMiddleware];
