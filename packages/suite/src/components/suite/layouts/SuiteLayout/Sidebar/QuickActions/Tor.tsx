import { goto } from 'src/actions/suite/routerActions';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectTorState } from '../../../../../../reducers/suite/suiteReducer';
import { isDesktop } from '@trezor/env-utils';
import {
    Column,
    ComponentWithSubIcon,
    Icon,
    IconName,
    iconSizes,
    IconVariant,
} from '@trezor/components';
import { TorStatus } from 'src/types/suite';
import { useTheme } from 'styled-components';
import { QuickActionButton } from './QuickActionButton';
import { spacings } from '@trezor/theme';
import { TooltipRow } from './TooltipRow';
import { Translation, TranslationKey } from '../../../../Translation';

const torStatusTranslationMap: Record<TorStatus, TranslationKey> = {
    [TorStatus.Enabled]: 'TR_TOR_ENABLED',
    [TorStatus.Disabled]: 'TR_TOR_DISABLED',
    [TorStatus.Disabling]: 'TR_TOR_DISABLING',
    [TorStatus.Enabling]: 'TR_TOR_ENABLING',
    [TorStatus.Error]: 'TR_TOR_ERROR',
    [TorStatus.Misbehaving]: 'TR_TOR_MISBEHAVING',
};

const torIconMap: Record<TorStatus, IconName> = {
    [TorStatus.Enabled]: 'check',
    [TorStatus.Disabled]: 'close',
    [TorStatus.Disabling]: 'arrowsCircle',
    [TorStatus.Enabling]: 'arrowsCircle',
    [TorStatus.Error]: 'warningTriangle',
    [TorStatus.Misbehaving]: 'warningTriangle',
};

const torIconVariantMap: Record<TorStatus, IconVariant> = {
    [TorStatus.Enabled]: 'primary',
    [TorStatus.Disabled]: 'destructive',
    [TorStatus.Disabling]: 'destructive',
    [TorStatus.Enabling]: 'info',
    [TorStatus.Error]: 'warning',
    [TorStatus.Misbehaving]: 'warning',
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
                tooltip={<TorTooltip variant={variant} iconName={iconName} torStatus={torStatus} />}
                onClick={() => dispatch(goto('settings-index', { anchor: SettingsAnchor.Tor }))}
            >
                <ComponentWithSubIcon
                    variant={variant}
                    subIconProps={{
                        name: iconName,
                        color: theme['iconDefaultInverted'],
                        size: iconSizes.extraSmall,
                    }}
                >
                    <Icon name="torBrowser" size={iconSizes.medium} variant="tertiary" />
                </ComponentWithSubIcon>
            </QuickActionButton>
        )
    );
};
