import { goto } from 'src/actions/suite/routerActions';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { useDispatch, useSelector, useTranslation } from 'src/hooks/suite';
import { selectTorState } from '../../../../../../reducers/suite/suiteReducer';
import { isDesktop } from '@trezor/env-utils';
import { ComponentWithSubIcon, Icon, IconName, iconSizes, IconVariant } from '@trezor/components';
import { TorStatus } from 'src/types/suite';
import { useTheme } from 'styled-components';
import { QuickActionButton } from './QuickActionButton';

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

export const Tor = () => {
    const { translationString } = useTranslation();
    const dispatch = useDispatch();
    const theme = useTheme();

    const { torStatus, isTorDisabled } = useSelector(selectTorState);
    const isTorIconVisible = isDesktop() && !isTorDisabled;

    return (
        isTorIconVisible && (
            <QuickActionButton
                tooltip={translationString('TR_TOR')}
                onClick={() => dispatch(goto('settings-index', { anchor: SettingsAnchor.Tor }))}
            >
                <ComponentWithSubIcon
                    variant={torIconVariantMap[torStatus]}
                    subIconProps={{
                        name: torIconMap[torStatus],
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
