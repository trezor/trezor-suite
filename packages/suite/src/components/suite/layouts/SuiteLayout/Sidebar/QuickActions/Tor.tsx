import { Translation, TranslationKey } from '@suite/intl';
import { SettingsAnchor , goto } from '@suite/router';
import { Column, Icon, IconName, UIIntent } from '@trezor/components';
import { isDesktop } from '@trezor/env-utils';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectTorState } from 'src/selectors/suite/suiteSelectors';
import { TorStatus } from 'src/types/suite';

import { QuickActionButton } from './QuickActionButton';
import { TooltipRow } from './TooltipRow';

const torStatusTranslationMap: Record<TorStatus, TranslationKey> = {
    [TorStatus.Enabled]: 'TR_TOR_ENABLED',
    [TorStatus.Disabled]: 'TR_TOR_DISABLED',
    [TorStatus.Disabling]: 'TR_TOR_DISABLING',
    [TorStatus.Enabling]: 'TR_TOR_ENABLING',
    [TorStatus.Error]: 'TR_TOR_ERROR',
    [TorStatus.Slow]: 'TR_TOR_SLOW',
};

const torIconMap: Record<TorStatus, IconName> = {
    [TorStatus.Enabled]: 'check',
    [TorStatus.Disabled]: 'x',
    [TorStatus.Disabling]: 'arrowsClockwise',
    [TorStatus.Enabling]: 'arrowsClockwise',
    [TorStatus.Error]: 'warning',
    [TorStatus.Slow]: 'info',
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

    const { torStatus, isTorDisabled } = useSelector(selectTorState);
    const isTorIconVisible = isDesktop() && !isTorDisabled;

    const iconName = torIconMap[torStatus];

    return (
        isTorIconVisible && (
            <QuickActionButton
                tooltip={{
                    content: (
                        <Column padding={4} alignItems="start">
                            <TooltipRow
                                iconName={iconName}
                                intent={torIntentMap[torStatus]}
                                header={<Translation id="TR_TOR" />}
                                leftItem={<Icon name="torBrowser" size={16} />}
                            >
                                <Translation id={torStatusTranslationMap[torStatus]} />
                            </TooltipRow>
                        </Column>
                    ),
                }}
                onClick={() => dispatch(goto({ routeName: 'settings-index', anchor: SettingsAnchor.Tor }))}
                iconName="torBrowser"
                subIconIntent={torIntentMap[torStatus]}
                subIconName={iconName}
            />
        )
    );
};
