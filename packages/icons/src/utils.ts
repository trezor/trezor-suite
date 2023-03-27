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
