import { ButtonIntent, Column, Icon, IconName, IconVariant } from '@trezor/components';
import { isDesktop } from '@trezor/env-utils';
import { spacings } from '@trezor/theme';

import { goto } from 'src/actions/suite/routerActions';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectTorState } from 'src/selectors/suite/suiteSelectors';
import { TorStatus } from 'src/types/suite';

import { QuickActionButton } from './QuickActionButton';
import { TooltipRow } from './TooltipRow';
import { Translation, TranslationKey } from '../../../../Translation';

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

const torIconVariantMap: Record<TorStatus, IconVariant> = {
    [TorStatus.Enabled]: 'primary',
    [TorStatus.Disabled]: 'destructive',
    [TorStatus.Disabling]: 'destructive',
    [TorStatus.Enabling]: 'info',
    [TorStatus.Error]: 'warning',
    [TorStatus.Slow]: 'info',
};

const torSubIconIntentMap: Record<TorStatus, ButtonIntent> = {
    [TorStatus.Enabled]: 'brand',
    [TorStatus.Disabled]: 'critical',
    [TorStatus.Disabling]: 'critical',
    [TorStatus.Enabling]: 'info',
    [TorStatus.Error]: 'warning',
    [TorStatus.Slow]: 'info',
};

type TorTooltipProps = {
    variant: IconVariant;
    iconName: IconName;
    torStatus: TorStatus;
};

const TorTooltip = ({ variant, iconName, torStatus }: TorTooltipProps) => (
    <Column gap={spacings.xs} alignItems="start">
        <TooltipRow
            circleIconName={iconName}
            variant={variant}
            header={<Translation id="TR_TOR" />}
            leftItem={<Icon name="torBrowser" size={16} />}
        >
            <Translation id={torStatusTranslationMap[torStatus]} />
        </TooltipRow>
    </Column>
);

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
                        <TorTooltip
                            variant={torIconVariantMap[torStatus]}
                            iconName={iconName}
                            torStatus={torStatus}
                        />
                    ),
                }}
                onClick={() => dispatch(goto('settings-index', { anchor: SettingsAnchor.Tor }))}
                iconName="torBrowser"
                subIconIntent={torSubIconIntentMap[torStatus]}
                subIconName={iconName}
            />
        )
    );
};
