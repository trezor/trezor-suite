import { selectDevice } from '@suite-common/wallet-core';
import { Warning, H3, Text, Button, IconButton, Row, Column } from '@trezor/components';
import { goto } from 'src/actions/suite/routerActions';
import { setFlag } from 'src/actions/suite/suiteActions';
import { Translation } from 'src/components/suite';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { useDiscovery, useDispatch, useSelector } from 'src/hooks/suite';
import { selectSuiteFlags } from 'src/reducers/suite/suiteReducer';

export const DashboardPassphraseBanner = () => {
    const dispatch = useDispatch();
    const { isDashboardPassphraseBannerVisible } = useSelector(selectSuiteFlags);
    const device = useSelector(selectDevice);
    const { isDiscoveryRunning } = useDiscovery();

    if (
        isDashboardPassphraseBannerVisible === false ||
        device?.useEmptyPassphrase === true ||
        isDiscoveryRunning === true ||
        isDiscoveryRunning === undefined
    )
        return null;

    const handleClose = () => {
        dispatch(setFlag('isDashboardPassphraseBannerVisible', false));
    };

    return (
        <Warning variant="secondary">
            <Row justifyContent="space-between" alignItems="center" gap={16} flex={1}>
                <Column gap={4} alignItems="flex-start" flex={1}>
                    <H3>
                        <Translation id="TR_CONNECT_DEVICE_PASSPHRASE_BANNER_TITLE" />
                    </H3>
                    <Text color="textDefaultInverted">
                        <Translation id="TR_CONNECT_DEVICE_PASSPHRASE_BANNER_DESCRIPTION" />
                    </Text>
                </Column>

                <Row gap={8}>
                    <Button
                        onClick={() => {
                            handleClose();
                            dispatch(
                                goto('settings-device', {
                                    anchor: SettingsAnchor.DefaultWalletLoading,
                                }),
                            );
                        }}
                    >
                        <Translation id="TR_CONNECT_DEVICE_PASSPHRASE_BANNER_BUTTON" />
                    </Button>
                    <IconButton icon="CROSS" variant="tertiary" onClick={handleClose} />
                </Row>
            </Row>
        </Warning>
    );
};
