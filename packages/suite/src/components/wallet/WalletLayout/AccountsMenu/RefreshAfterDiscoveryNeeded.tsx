import React from 'react';

import { AnimatePresence, type MotionProps, motion } from 'framer-motion';
import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { selectSelectedDevice } from '@suite-common/device';
import {
    selectShowRediscoverButton,
    startOrRestartDiscoveryThunk,
} from '@suite-common/wallet-core';
import { Button, IconButton, Row, Tooltip, motionEasing } from '@trezor/components';
import { spacings, spacingsPx, typography } from '@trezor/theme';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { useResponsiveContext } from 'src/support/suite/ResponsiveContext';

import { AccountsMenuNotice } from './AccountsMenuNotice';

const DiscoveryButtonContainer = styled(motion.div)`
    display: flex;
    flex-direction: column;
    justify-content: center;
    margin: 0 ${spacingsPx.sm} ${spacingsPx.xxl} ${spacingsPx.sm};
    border-top: solid 1px ${({ theme }) => theme.borderNeutral};
    ${typography['body-sm']}
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
    const { isSidebarCollapsed } = useResponsiveContext();
    const isDiscoveryButtonVisible = useSelector(state =>
        selectShowRediscoverButton(state, selectedDevice),
    );

    if (!selectedDevice?.connected) {
        return null;
    }

    const restartDiscovery = () => dispatch(startOrRestartDiscoveryThunk());

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
                                    intent="neutral"
                                    priority="secondary"
                                    icon="repeat"
                                    onClick={restartDiscovery}
                                />
                            </Tooltip>
                        </Row>
                    ) : (
                        <DiscoveryButtonContainer {...animationConfig}>
                            <AccountsMenuNotice>
                                <Translation id="TR_DISCOVERY_NEW_COINS_TEXT" />
                            </AccountsMenuNotice>

                            <Button
                                intent="neutral"
                                priority="secondary"
                                size="small"
                                iconLeft="repeat"
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
