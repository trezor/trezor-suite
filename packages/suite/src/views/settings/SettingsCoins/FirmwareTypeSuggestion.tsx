import { Translation } from '@suite/intl';
import { SettingsAnchor, goto } from '@suite/router';
import { Banner, Paragraph } from '@trezor/components';
import { hasBitcoinOnlyFirmware } from '@trezor/device-utils';

import { setFlag } from 'src/actions/suite/suiteActions';
import { useDevice, useDispatch } from 'src/hooks/suite';

export const FirmwareTypeSuggestion = () => {
    const dispatch = useDispatch();
    const { device } = useDevice();

    const translationId = hasBitcoinOnlyFirmware(device)
        ? 'TR_SETTINGS_COINS_REGULAR_FIRMWARE_SUGGESTION'
        : 'TR_SETTINGS_COINS_BITCOIN_ONLY_FIRMWARE_SUGGESTION';

    const handleClose = () => dispatch(setFlag('firmwareTypeBannerClosed', true));

    const goToFirmwareType = () =>
        dispatch(goto({ routeName: 'settings-device', anchor: SettingsAnchor.FirmwareType }));

    return (
        <Banner
            intent="info"
            icon="currencyBtc"
            rightContent={
                <Banner.Button onClick={handleClose}>
                    <Translation id="TR_GOT_IT" />
                </Banner.Button>
            }
            description={
                <Paragraph>
                    <Translation
                        id={translationId}
                        values={{
                            button: chunks => (
                                <Banner.Button
                                    margin={{ horizontal: 2 }}
                                    intent="info"
                                    size="small"
                                    onClick={goToFirmwareType}
                                >
                                    {chunks}
                                </Banner.Button>
                            ),
                            bitcoinOnly: <Translation id="TR_FIRMWARE_TYPE_BITCOIN_ONLY" />,
                            regular: <Translation id="TR_FIRMWARE_TYPE_REGULAR" />,
                        }}
                    />
                </Paragraph>
            }
        />
    );
};
