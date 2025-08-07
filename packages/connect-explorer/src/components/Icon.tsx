import {
    Icon as BaseIcon,
    IconProps as BaseIconProps,
} from '@trezor/components/src/components/Icon/IconBase';

export const iconAssetsConnectExplorer = {
    book: require('@suite-common/icons/assets/book.svg'),
    bookOpenText: require('@suite-common/icons/assets/bookOpenText.svg'),
    check: require('@suite-common/icons/assets/check.svg'),
    githubLogoAlt: require('@suite-common/icons/assets/githubLogoAlt.svg'),
    plus: require('@suite-common/icons/assets/plus.svg'),
    x: require('@suite-common/icons/assets/x.svg'),
    arrowRight: require('@suite-common/icons/assets/arrowRight.svg'),
    caretCircleDown: require('@suite-common/icons/assets/caretCircleDown.svg'),
    lightning: require('@suite-common/icons/assets/lightning.svg'),
    newspaper: require('@suite-common/icons/assets/newspaper.svg'),
} as const;

export const Icon = (props: BaseIconProps & { name: keyof typeof iconAssetsConnectExplorer }) => (
    <BaseIcon {...props} src={iconAssetsConnectExplorer[props.name]} />
);
