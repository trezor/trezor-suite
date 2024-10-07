import { tryLocalAssetRequire } from './assetUtils';

export const httpRequest = (url: string, _type: string): any => tryLocalAssetRequire(url);
