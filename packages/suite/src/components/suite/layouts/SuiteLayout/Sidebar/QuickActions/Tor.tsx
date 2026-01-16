import { useTheme } from 'styled-components';

import { Translation, TranslationKey } from '@suite/intl';
import {
    Column,
    ComponentWithSubIcon,
    Icon,
    IconName,
    IconVariant,
    iconSizes,
} from '@trezor/components';
import { isDesktop } from '@trezor/env-utils';
import { spacings } from '@trezor/theme';

import { goto } from 'src/actions/suite/routerActions';
import { SettingsAnchor } from 'src/constants/suite/anchors';
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

const torIconVariantMap: Record<TorStatus, IconVariant> = {
    [TorStatus.Enabled]: 'primary',
    [TorStatus.Disabled]: 'destructive',
    [TorStatus.Disabling]: 'destructive',
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
            leftItem={<Icon name="torBrowser" size={iconSizes.medium} />}
        >
            <Translation id={torStatusTranslationMap[torStatus]} />
        </TooltipRow>
    </Column>
);

export const Tor = () => {
    const dispatch = useDispatch();
    const theme = useTheme();

    const { torStatus, isTorDisabled } = useSelector(selectTorState);
    const isTorIconVisible = isDesktop() && !isTorDisabled;

    const variant = torIconVariantMap[torStatus];
    const iconName = torIconMap[torStatus];

    return (
        isTorIconVisible && (
            <QuickActionButton
                tooltip={{
                    content: (
                        <TorTooltip variant={variant} iconName={iconName} torStatus={torStatus} />
                    ),
                }}
                onClick={() => dispatch(goto('settings-index', { anchor: SettingsAnchor.Tor }))}
            >
                <ComponentWithSubIcon
                    variant={variant}
                    icon={
                        <Icon
                            name={iconName}
                            color={theme.iconDefaultInverted}
                            size={iconSizes.extraSmall}
                        />
                    }
                >
                    <Icon name="torBrowser" size={iconSizes.medium} variant="tertiary" />
                </ComponentWithSubIcon>
            </QuickActionButton>
        )
    );
};
