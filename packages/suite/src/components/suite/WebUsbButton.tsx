import { IconButton, IconName, NewButton, NewButtonProps, Tooltip } from '@trezor/components';
import TrezorConnect from '@trezor/connect';
import type TrezorConnectWeb from '@trezor/connect-web';

import { Translation, TranslationKey } from './Translation';

type LegacyButtonVariant = 'primary' | 'info' | 'warning' | 'destructive' | 'tertiary';
type LegacyButtonSize = 'tiny' | 'small' | 'medium' | 'large';

interface WebUsbButtonProps
    extends Omit<
        NewButtonProps,
        'children' | 'iconLeft' | 'iconRight' | 'intent' | 'priority' | 'size'
    > {
    translationId?: TranslationKey;
    icon?: IconName | false;
    variant?: LegacyButtonVariant;
    size?: LegacyButtonSize;
}

const handleClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.stopPropagation();
    (TrezorConnect as typeof TrezorConnectWeb).requestWebUSBDevice();
};

const mapVariantToIntent = (variant: LegacyButtonVariant = 'primary'): NewButtonProps['intent'] => {
    switch (variant) {
        case 'primary':
            return 'brand';
        case 'info':
            return 'info';
        case 'warning':
            return 'warning';
        case 'destructive':
            return 'critical';
        case 'tertiary':
            return 'neutral';
        default:
            return 'brand';
    }
};

const mapSize = (size: LegacyButtonSize = 'small'): NewButtonProps['size'] | undefined => {
    switch (size) {
        case 'tiny':
            return 'small';
        case 'small':
            return 'small';
        case 'large':
            return 'large';
        case 'medium':
            return 'medium';
        default:
            return 'small';
    }
};

export const WebUsbButton = ({
    translationId = 'TR_CHECK_FOR_DEVICES',
    icon = 'magnifyingGlass',
    size = 'tiny',
    variant = 'primary',
    ...rest
}: WebUsbButtonProps) => (
    <div data-testid="web-usb-button">
        <NewButton
            {...rest}
            iconLeft={icon === false ? undefined : icon}
            size={mapSize(size)}
            intent={mapVariantToIntent(variant)}
            onClick={handleClick}
        >
            <Translation id={translationId} />
        </NewButton>
    </div>
);

export const WebUsbIconButton = ({
    translationId = 'TR_CHECK_FOR_DEVICES',
    size = 'small',
    variant = 'primary',
    ...rest
}: WebUsbButtonProps) => (
    <div data-testid="web-usb-button">
        <Tooltip content={<Translation id={translationId} />}>
            <IconButton
                {...rest}
                icon="magnifyingGlass"
                variant={variant}
                size={size}
                onClick={handleClick}
            />
        </Tooltip>
    </div>
);
