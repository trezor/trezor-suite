import React from 'react';

import { AnimatePresence, MotionProps, motion } from 'framer-motion';
import styled from 'styled-components';

import {
    restartDiscoveryThunk,
    selectIsDeviceDiscoveryActive,
    selectIsRediscoverNeeded,
    selectSelectedDevice,
} from '@suite-common/wallet-core';
import { Button, IconButton, Row, Tooltip, motionEasing } from '@trezor/components';
import { spacings, spacingsPx, typography } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';

import { AccountsMenuNotice } from './AccountsMenuNotice';
import { useIsSidebarCollapsed } from '../../../suite/layouts/SuiteLayout/Sidebar/utils';

const DiscoveryButtonContainer = styled(motion.div)`
    display: flex;
    flex-direction: column;
    justify-content: center;
    margin: 0 ${spacingsPx.sm} ${spacingsPx.xxl} ${spacingsPx.sm};
    border-top: solid 1px ${({ theme }) => theme.borderElevation1};
    ${typography.hint}
    align-items: center;
`;

const animationConfig: MotionProps = {
    initial: {
        opacity: 0,
    },
    animate: {
        opacity: 1,
    },
    exit: {
        opacity: 0,
    },
    transition: {
        ease: motionEasing.transition,
        duration: 0.2,
    },
};

export const RefreshAfterDiscoveryNeeded = () => {
    const dispatch = useDispatch();
    const selectedDevice = useSelector(selectSelectedDevice);
    const isDiscoveryButtonVisible = useSelector(state =>
        selectIsRediscoverNeeded(state, selectedDevice?.state?.staticSessionId),
    );
    const isSidebarCollapsed = useIsSidebarCollapsed();
    const isDiscoveryInProgress = useSelector(selectIsDeviceDiscoveryActive);
    if (!selectedDevice?.connected) {
        return null;
    }

    const restartDiscovery = () => dispatch(restartDiscoveryThunk());

    return (
        <AnimatePresence>
            {isDiscoveryButtonVisible && (
                <>
                    {isSidebarCollapsed ? (
                        <Row
                            justifyContent="center"
                            margin={{ top: spacings.xs, bottom: spacings.lg }}
                        >
                            <Tooltip content={<Translation id="REFRESH" />}>
                                <IconButton
                                    isDisabled={isDiscoveryInProgress}
                                    variant="tertiary"
                                    size="tiny"
                                    icon="repeat"
                                    onClick={restartDiscovery}
                                />
                            </Tooltip>
                        </Row>
                    ) : (
                        <DiscoveryButtonContainer {...animationConfig}>
                            <AccountsMenuNotice>
                                <Translation id="TR_DISCOVERY_NEW_COINS_TEXT" isNested={false} />
                            </AccountsMenuNotice>

                            <Button
                                isDisabled={isDiscoveryInProgress}
                                variant="tertiary"
                                size="tiny"
                                icon="repeat"
                                onClick={restartDiscovery}
                            >
                                <Translation id="REFRESH" />
                            </Button>
                        </DiscoveryButtonContainer>
                    )}
                </>
            )}
        </AnimatePresence>
    );
};
