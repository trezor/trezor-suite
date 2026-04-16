import { type FC, useState } from 'react';

import { Translation } from '@suite/intl';
import { SettingsAnchor, goto, selectRouteName } from '@suite/router';
import { selectIsDeviceInitialized } from '@suite-common/device';
import { Button, Column, Link, Paragraph, Text, Tooltip } from '@trezor/components';
import { isDesktop } from '@trezor/env-utils';

import { useDispatch, useSelector } from 'src/hooks/suite';

import { NavigationItem, type NavigationItemProps } from './NavigationItem';

export const SettingsWithTooltip: FC<NavigationItemProps> = props => {
    const dispatch = useDispatch();
    const [isDismissed, setIsDismissed] = useState(false);

    const routeName = useSelector(selectRouteName);
    const isDeviceInitialized = useSelector(selectIsDeviceInitialized);

    const isTooltipOpen = !isDismissed && routeName === 'suite-start' && !isDeviceInitialized;
    const handleTooltipClose = () => setIsDismissed(true);

    return (
        <Tooltip
            isOpen={isTooltipOpen}
            content={
                <Column padding={2} gap={6}>
                    <Paragraph textWrap="pretty">
                        <Translation
                            id={
                                isDesktop()
                                    ? 'TR_SETTINGS_TOOLTIP_DESCRIPTION_DESKTOP'
                                    : 'TR_SETTINGS_TOOLTIP_DESCRIPTION_WEB'
                            }
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
