import { selectDevice } from '@suite-common/wallet-core';
import { Banner, H3, Text, Button, IconButton, Row, Column } from '@trezor/components';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { goto } from 'src/actions/suite/routerActions';
import { setFlag } from 'src/actions/suite/suiteActions';
import { Translation } from 'src/components/suite';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { useDiscovery, useDispatch, useSelector } from 'src/hooks/suite';
import { selectSuiteFlags } from 'src/reducers/suite/suiteReducer';
import { bannerAnimationConfig } from './banner-animations';
import { WalletType } from '@suite-common/wallet-types';
import styled from 'styled-components';

const Container = styled(motion.div)`
    width: 100%;
`;

export const DashboardPassphraseBanner = () => {
    const [isVisible, setIsVisible] = useState(true);
    const dispatch = useDispatch();
    const { isDashboardPassphraseBannerVisible } = useSelector(selectSuiteFlags);
    const selectedAddressDisplay = useSelector(state => state.suite.settings.defaultWalletLoading);
    const device = useSelector(selectDevice);
    const { isDiscoveryRunning } = useDiscovery();

    if (
        isDashboardPassphraseBannerVisible === false ||
        device?.useEmptyPassphrase === true ||
        isDiscoveryRunning === true ||
        isDiscoveryRunning === undefined ||
        selectedAddressDisplay === WalletType.PASSPHRASE
    ) {
        return null;
    }

    const handleManageClick = () => {
        setIsVisible(false);
        dispatch(
            goto('settings-device', {
                anchor: SettingsAnchor.DefaultWalletLoading,
            }),
        );
    };

    const handleClose = () => {
        dispatch(setFlag('isDashboardPassphraseBannerVisible', false));
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <Container
                    key="container"
                    {...bannerAnimationConfig}
                    onAnimationComplete={handleClose}
                >
                    <Banner
                        variant="tertiary"
                        icon="asterisk"
                        rightContent={
                            <Row gap={8}>
                                <Button onClick={handleManageClick} size="small">
                                    <Translation id="TR_CONNECT_DEVICE_PASSPHRASE_BANNER_BUTTON" />
                                </Button>
                                <IconButton
                                    icon="x"
                                    variant="tertiary"
                                    size="small"
                                    onClick={() => {
                                        setIsVisible(false);
                                    }}
                                />
                            </Row>
                        }
                    >
                        <Column gap={4} alignItems="flex-start" flex="1">
                            <H3 color="textDefault">
                                <Translation id="TR_CONNECT_DEVICE_PASSPHRASE_BANNER_TITLE" />
                            </H3>
                            <Text color="textDefaultInverted">
                                <Translation id="TR_CONNECT_DEVICE_PASSPHRASE_BANNER_DESCRIPTION" />
                            </Text>
                        </Column>
                    </Banner>
                </Container>
            )}
        </AnimatePresence>
    );
};
