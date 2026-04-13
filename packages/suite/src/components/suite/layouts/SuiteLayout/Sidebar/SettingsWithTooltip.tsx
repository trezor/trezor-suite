import { type FC } from 'react';

import { selectFlags, setFlag } from '@suite/flags';
import { Translation } from '@suite/intl';
import { SettingsAnchor, goto, selectRouteName } from '@suite/router';
import { selectHasBitcoinOnlyFirmware, selectIsDeviceInitialized } from '@suite-common/device';
import { Button, Column, Link, Paragraph, Text, Tooltip } from '@trezor/components';
import { isDesktop } from '@trezor/env-utils';

import { useDispatch, useSelector } from 'src/hooks/suite';

import { NavigationItem, type NavigationItemProps } from './NavigationItem';

const getDescriptionTranslationId = (hasBitcoinOnlyFirmware: boolean) => {
    if (hasBitcoinOnlyFirmware) {
        return 'TR_SETTINGS_TOOLTIP_DESCRIPTION_BTC_ONLY';
    }

    if (isDesktop()) {
        return 'TR_SETTINGS_TOOLTIP_DESCRIPTION_DESKTOP';
    }

    return 'TR_SETTINGS_TOOLTIP_DESCRIPTION_WEB';
};

export const SettingsWithTooltip: FC<NavigationItemProps> = props => {
    const dispatch = useDispatch();

    const { settingsSidebarTooltipClosed } = useSelector(selectFlags);
    const routeName = useSelector(selectRouteName);
    const hasBitcoinOnlyFirmware = useSelector(selectHasBitcoinOnlyFirmware);
    const isDeviceInitialized = useSelector(selectIsDeviceInitialized);

    const shouldShowTooltip = !hasBitcoinOnlyFirmware || isDesktop();
    const isTooltipOpen =
        shouldShowTooltip &&
        !settingsSidebarTooltipClosed &&
        routeName === 'suite-start' &&
        !isDeviceInitialized;
    const handleTooltipClose = () =>
        dispatch(setFlag({ key: 'settingsSidebarTooltipClosed', value: true }));

    const descriptionTranslationId = getDescriptionTranslationId(hasBitcoinOnlyFirmware);

    return (
        <Tooltip
            isOpen={isTooltipOpen}
            content={
                <Column padding={2} gap={6}>
                    <Paragraph textWrap="pretty">
                        <Translation
                            id={descriptionTranslationId}
                            values={{
                                strong: chunks => (
                                    <Text typographyStyle="body-sm-strong">{chunks}</Text>
                                ),
                                tor: chunks => (
                                    <Link
                                        onClick={() =>
                                            dispatch(
                                                goto({
                                                    routeName: 'settings-index',
                                                    anchor: SettingsAnchor.Tor,
                                                }),
                                            )
                                        }
                                    >
                                        {chunks}
                                    </Link>
                                ),
                                networks: chunks => (
                                    <Link
                                        onClick={() =>
                                            dispatch(goto({ routeName: 'settings-coins' }))
                                        }
                                    >
                                        {chunks}
                                    </Link>
                                ),
                            }}
                        />
                    </Paragraph>
                    <Button
                        size="small"
                        intent="neutral"
                        priority="secondary"
                        onClick={handleTooltipClose}
                        margin={{ left: 'auto' }}
                    >
                        <Translation id="TR_GOT_IT" />
                    </Button>
                </Column>
            }
            hasArrow
            placement="bottom-start"
            tooltipMaxWidth={210}
        >
            <NavigationItem {...props} />
        </Tooltip>
    );
};
