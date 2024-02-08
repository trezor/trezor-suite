import React from 'react';
import styled from 'styled-components';
import { AnimatePresence, MotionProps, motion } from 'framer-motion';

import { Button, motionEasing } from '@trezor/components';
import { spacingsPx, typography } from '@trezor/theme';
import { startDiscoveryThunk } from '@suite-common/wallet-core';

import { useRediscoveryNeeded, useDispatch } from 'src/hooks/suite';

import { Translation } from 'src/components/suite';
import { AccountsMenuNotice } from './AccountsMenuNotice';

const DiscoveryButtonContainer = styled(motion.div)`
    display: flex;
    flex-direction: column;
    justify-content: center;
    margin: 0 ${spacingsPx.sm} ${spacingsPx.xxl} ${spacingsPx.sm};
    border-top: solid 1px ${({ theme }) => theme.borderOnElevation0};
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
    const isDiscoveryButtonVisible = useRediscoveryNeeded();

    const startDiscovery = () => {
        dispatch(startDiscoveryThunk());
    };

    return (
        <AnimatePresence>
            {isDiscoveryButtonVisible && (
                <DiscoveryButtonContainer {...animationConfig}>
                    <AccountsMenuNotice>
                        <Translation id="TR_DISCOVERY_NEW_COINS_TEXT" isNested={false} />
                    </AccountsMenuNotice>

                    <Button variant="tertiary" size="tiny" icon="REFRESH" onClick={startDiscovery}>
                        <Translation id="REFRESH" />
                    </Button>
                </DiscoveryButtonContainer>
            )}
        </AnimatePresence>
    );
};
