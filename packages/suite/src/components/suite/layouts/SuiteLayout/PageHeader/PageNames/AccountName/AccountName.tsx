import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { AnimatePresence, MotionProps, motion } from 'framer-motion';
import { motionEasing } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { Account } from '@suite-common/wallet-types';
import { ACCOUNT_INFO_HEIGHT } from 'src/components/wallet/WalletLayout/AccountTopPanel/AccountTopPanel';
import { AccountDetails } from './AccountDetails';
import { SCROLL_WRAPPER_ID } from '../../../SuiteLayout';
import { AccountLabelHeader } from './AccountLabelHeader';

const AnimationContainer = styled(motion.div)`
    display: flex;
`;

const detailsAnimConfig: MotionProps = {
    initial: {
        y: 50,
        opacity: 0,
        rotateX: '45deg',
    },
    animate: {
        y: 0,
        opacity: 1,
        rotateX: '0deg',
    },
    exit: {
        y: 50,
        opacity: 0,
        rotateX: '45deg',
    },
    transition: {
        ease: motionEasing.transition,
        rotateX: { duration: 0.2 },
    },
};

const labelAnimConfig: MotionProps = {
    initial: {
        y: -50,
        opacity: 0,
        rotateX: '-45deg',
    },
    animate: {
        y: 0,
        opacity: 1,
        rotateX: '0deg',
    },
    exit: {
        y: -50,
        opacity: 0,
        rotateX: '-45deg',
    },
    transition: {
        ease: motionEasing.transition,
        duration: 0.3,
        rotateX: { duration: 0.2 },
    },
};

interface AccountNameProps {
    selectedAccount: Account;
}

export const AccountName = ({ selectedAccount }: AccountNameProps) => {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const scrollContainer = document.getElementById(SCROLL_WRAPPER_ID);

        if (!scrollContainer) return;

        const handleScroll = (e: Event) => {
            const target = e.target as HTMLElement;
            //  ContentWrapper top padding + info height + AccountInfo bottom margin
            const breakingPoint = spacings.lg + ACCOUNT_INFO_HEIGHT + spacings.lg;

            setIsScrolled(target.scrollTop > breakingPoint);
        };

        scrollContainer.addEventListener('scroll', handleScroll);

        return () => {
            scrollContainer.removeEventListener('scroll', handleScroll);
        };
    }, []);

    return (
        <AnimatePresence initial={false} mode="popLayout">
            {isScrolled ? (
                <AnimationContainer key="account-details" {...detailsAnimConfig}>
                    <AccountDetails selectedAccount={selectedAccount} />
                </AnimationContainer>
            ) : (
                <AnimationContainer key="account-label" {...labelAnimConfig}>
                    <AccountLabelHeader selectedAccount={selectedAccount} />
                </AnimationContainer>
            )}
        </AnimatePresence>
    );
};
