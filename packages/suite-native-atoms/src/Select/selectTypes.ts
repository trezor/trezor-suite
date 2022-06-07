import { CryptoIconName, cryptoIcons, FlagIconName, flagIcons } from '@trezor/icons';

export const isCryptoIconType = (
    iconName: CryptoIconName | FlagIconName,
): iconName is CryptoIconName => iconName in cryptoIcons;

export const isFlagIconType = (iconName: CryptoIconName | FlagIconName): iconName is FlagIconName =>
    iconName in flagIcons;
