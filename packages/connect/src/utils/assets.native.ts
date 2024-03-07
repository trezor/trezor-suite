import { getAssetByUrl } from './assetUtils';

export const httpRequest = (url: string, _type: string): any => getAssetByUrl(url);
