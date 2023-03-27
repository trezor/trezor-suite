import {
    CryptoIconName,
    cryptoIcons,
    EthereumTokenIconName,
    ethereumTokenIcons,
    FlagIconName,
    flagIcons,
    IconName,
    icons,
} from './icons';
import { IconNames } from './types';

export const isCryptoIconType = (iconName: IconNames): iconName is CryptoIconName =>
    iconName in cryptoIcons;

export const isIconType = (iconName: IconNames): iconName is IconName => iconName in icons;

export const isFlagIconType = (iconName: IconNames): iconName is FlagIconName =>
    iconName in flagIcons;

export const isEthereumTokenIconType = (iconName: IconNames): iconName is EthereumTokenIconName =>
    iconName in ethereumTokenIcons;

// TODO refactor - in rounded icon, this will be needed and needs to be improved
//  because now if we don't have this icon, the condition there will fallback wrong
export const getEthereumTokenIcon = (iconName: IconNames) => {
    if (isEthereumTokenIconType(iconName)) {
        return iconName;
    }
    return 'erc20';
};
