import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { AnimatePresence } from 'framer-motion';
import { spacings } from '@trezor/theme';
import { Account } from '@suite-common/wallet-types';
import { ACCOUNT_INFO_HEIGHT } from 'src/components/wallet/WalletLayout/AccountTopPanel/AccountTopPanel';
import { AccountDetails } from './AccountDetails';
import { SCROLL_WRAPPER_ID } from '../../../SuiteLayout';
import { AccountLabelHeader } from './AccountLabelHeader';

const AnimationContainer = styled.div`
    display: flex;
`;

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
                <AnimationContainer key="account-details">
                    <AccountDetails selectedAccount={selectedAccount} />
                </AnimationContainer>
            ) : (
                <AnimationContainer key="account-label">
                    <AccountLabelHeader selectedAccount={selectedAccount} />
                </AnimationContainer>
            )}
        </AnimatePresence>
    );
};
