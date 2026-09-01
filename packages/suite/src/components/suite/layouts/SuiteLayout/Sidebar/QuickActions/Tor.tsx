import { useDispatch } from 'react-redux';

import { Translation, type TranslationKey } from '@suite/intl';
import { SettingsAnchor, goto } from '@suite/router';
import { TorStatus, selectIsTorDisabled, selectTorStatus } from '@suite/tor';
import { Column, Icon, type IconComponent, type UIIntent } from '@trezor/components';
import { isDesktop } from '@trezor/env-utils';
import {
    ArrowsClockwiseIcon,
    CheckIcon,
    InfoIcon,
    TorBrowserIcon,
    WarningIcon,
    XIcon,
} from '@trezor/icons';
import { QuickActionButton, TooltipRow } from '@trezor/product-components';

import { useSelector } from 'src/hooks/suite';

const torStatusTranslationMap: Record<TorStatus, TranslationKey> = {
    [TorStatus.Enabled]: 'TR_TOR_ENABLED',
    [TorStatus.Disabled]: 'TR_TOR_DISABLED',
    [TorStatus.Disabling]: 'TR_TOR_DISABLING',
    [TorStatus.Enabling]: 'TR_TOR_ENABLING',
    [TorStatus.Error]: 'TR_TOR_ERROR',
    [TorStatus.Slow]: 'TR_TOR_SLOW',
};

const torIconMap: Record<TorStatus, IconComponent> = {
    [TorStatus.Enabled]: CheckIcon,
    [TorStatus.Disabled]: XIcon,
    [TorStatus.Disabling]: ArrowsClockwiseIcon,
    [TorStatus.Enabling]: ArrowsClockwiseIcon,
    [TorStatus.Error]: WarningIcon,
    [TorStatus.Slow]: InfoIcon,
};

const torIntentMap: Record<TorStatus, UIIntent> = {
    [TorStatus.Enabled]: 'brand',
    [TorStatus.Disabled]: 'critical',
    [TorStatus.Disabling]: 'critical',
    [TorStatus.Enabling]: 'info',
    [TorStatus.Error]: 'warning',
    [TorStatus.Slow]: 'info',
};

export const Tor = () => {
    const dispatch = useDispatch();

    const torStatus = useSelector(selectTorStatus);
    const isTorDisabled = useSelector(selectIsTorDisabled);
    const isTorIconVisible = isDesktop() && !isTorDisabled;

    const iconName = torIconMap[torStatus];

    return (
        isTorIconVisible && (
            <QuickActionButton
                tooltip={{
                    content: (
                        <Column padding={4} alignItems="start">
                            <TooltipRow
                                icon={iconName}
                                intent={torIntentMap[torStatus]}
                                header={<Translation id="TR_TOR" />}
                                leftItem={<Icon as={TorBrowserIcon} size={16} />}
                            >
                                <Translation id={torStatusTranslationMap[torStatus]} />
                            </TooltipRow>
                        </Column>
                    ),
                }}
                onClick={() =>
                    dispatch(goto({ routeName: 'settings-index', anchor: SettingsAnchor.Tor }))
                }
                icon={TorBrowserIcon}
                subIconIntent={torIntentMap[torStatus]}
                subIcon={iconName}
            />
        )
    );
};
