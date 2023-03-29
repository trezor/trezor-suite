import { EthereumTokenSymbol } from '@suite-common/wallet-types';

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
import { AnyIconName } from './types';

export const isCryptoIconType = (iconName: AnyIconName): iconName is CryptoIconName =>
    iconName in cryptoIcons;

export const isIconType = (iconName: AnyIconName): iconName is IconName => iconName in icons;

export const isFlagIconType = (iconName: AnyIconName): iconName is FlagIconName =>
    iconName in flagIcons;

// First we check whether the name is in the list of Ethereum token symbols.
// Since we cannot guarantee this, if it's not, we default to the 'erc20' icon.
// Then we check whether the name is in the list of Ethereum token icons.
const getIsEthereumTokenIconUploaded = (name: EthereumTokenSymbol) =>
    (name in ethereumTokenIcons ? name : 'erc20') as EthereumTokenIconName;
export const isEthereumTokenIconType = (
    iconName: AnyIconName,
): iconName is EthereumTokenIconName => {
    if (!getIsEthereumTokenIconUploaded(iconName as EthereumTokenSymbol)) {
        return 'erc20' in ethereumTokenIcons;
    }
    return iconName in ethereumTokenIcons;
};
