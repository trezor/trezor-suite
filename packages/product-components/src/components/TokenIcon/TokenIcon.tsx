import { NativeTokenIcon } from './NativeTokenIcon';
import { NonNativeTokenIcon } from './NonNativeTokenIcon';
import { type TokenIconProps } from './tokenIconTypes';
import { NetworkIconBadge } from '../NetworkIcon/NetworkIconBadge';

export const TokenIcon = ({ badge, ...props }: TokenIconProps) => {
    let icon = null;
    if (props.sources) {
        icon = <NonNativeTokenIcon {...props} sources={props.sources} />;
    } else if (props.src) {
        icon = <NativeTokenIcon {...props} src={props.src} />;
    }

    return badge ? (
        <NetworkIconBadge
            iconSrc={badge.src}
            iconColor={badge.color}
            iconBackgroundColor={badge.backgroundColor}
            iconDataTestId={badge['data-testid']}
            parentSize={props.size ?? 32}
        >
            {icon}
        </NetworkIconBadge>
    ) : (
        icon
    );
};
