import { IconProps as BaseIconProps, Icon as IconBase } from './IconBase';
export {
    iconSizes,
    type IconVariant,
    type IconSize,
    getIconSize,
    allowedIconFrameProps,
    getColorForIconVariant,
    iconVariants,
    type ExclusiveColorOrVariant,
} from './IconBase';
const srcDict = {
    asterisk: require('@suite-common/icons/assets/asterisk.svg'),
    arrowRight: require('@suite-common/icons/assets/arrowRight.svg'),
    arrowUpRight: require('@suite-common/icons/assets/arrowUpRight.svg'),
    bug: require('@suite-common/icons/assets/bug.svg'),
    caretCircleDown: require('@suite-common/icons/assets/caretCircleDown.svg'),
    caretDown: require('@suite-common/icons/assets/caretDown.svg'),
    caretLeft: require('@suite-common/icons/assets/caretLeft.svg'),
    caretRight: require('@suite-common/icons/assets/caretRight.svg'),
    check: require('@suite-common/icons/assets/check.svg'),
    checkCircleFilled: require('@suite-common/icons/assets/checkCircleFilled.svg'),
    coins: require('@suite-common/icons/assets/coins.svg'),
    dotsThree: require('@suite-common/icons/assets/dotsThree.svg'),
    eye: require('@suite-common/icons/assets/eye.svg'),
    eyeSlash: require('@suite-common/icons/assets/eyeSlash.svg'),
    info: require('@suite-common/icons/assets/info.svg'),
    lightbulb: require('@suite-common/icons/assets/lightbulb.svg'),
    lock: require('@suite-common/icons/assets/lock.svg'),
    magnifyingGlass: require('@suite-common/icons/assets/magnifyingGlass.svg'),
    pencil: require('@suite-common/icons/assets/pencil.svg'),
    plus: require('@suite-common/icons/assets/plus.svg'),
    question: require('@suite-common/icons/assets/question.svg'),
    wallet: require('@suite-common/icons/assets/wallet.svg'),
    warning: require('@suite-common/icons/assets/warning.svg'),
    x: require('@suite-common/icons/assets/x.svg'),
    xCircle: require('@suite-common/icons/assets/xCircle.svg'),
    xCircleFilled: require('@suite-common/icons/assets/xCircleFilled.svg'),
};

export type IconProps = Omit<BaseIconProps, 'src'> &
    // meth.. probably not worth?
    (| {
              name: keyof typeof srcDict;
              icon?: undefined;
          }
        | {
              name?: undefined;
              icon: React.ReactElement;
          }
    );

export const Icon = (props: IconProps) => {
    if (props.name && !srcDict[props.name]) {
        console.error(`Icon: Icon with name "${props.name}" does not exist.`);
    }
    if (props.name) {
        return <IconBase {...props} src={srcDict[props.name]} color={undefined} />;
    }
    return props.icon;
};
