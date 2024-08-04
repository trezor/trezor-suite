import { AssetLogoSize } from './AssetLogo/AssetLogo';

const DEFAULT_LOGO_SIZE_USED_WITH_URL = 24;

const ASSET_LOGO_SIZES_USED_WITH_URL = [16, 24];

// TODO: once we have available icons bigger than 24px using url (not symbol), we don't need this function
export const getRightLogoSizeUsedWithUrl = (size: AssetLogoSize) =>
    ASSET_LOGO_SIZES_USED_WITH_URL.includes(size) ? size : DEFAULT_LOGO_SIZE_USED_WITH_URL;
