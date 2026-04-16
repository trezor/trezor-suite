import { useEffect, useState } from 'react';

import { type Account } from '@suite-common/wallet-types';

import { HEADER_HEIGHT } from 'src/constants/suite/layout';
import { useOptionalAccountHeaderContext } from 'src/support/suite/AccountHeaderProvider';

import { AccountDetails } from './AccountDetails';

interface AccountNameProps {
    selectedAccount: Account;
}

export const AccountName = ({ selectedAccount }: AccountNameProps) => {
    const [isScrolled, setIsScrolled] = useState(false);
    const accountHeaderContext = useOptionalAccountHeaderContext();
    const balanceSectionRef = accountHeaderContext?.balanceSectionRef;

    useEffect(() => {
        const target = balanceSectionRef?.current;
        if (!target) return;

        const observer = new IntersectionObserver(
            entries => {
                const entry = entries[0];
                if (entry) {
                    setIsScrolled(!entry.isIntersecting);
                }
            },
            {
                root: null,
                threshold: 0,
                rootMargin: `-${HEADER_HEIGHT} 0px 0px 0px`,
            },
        );

        observer.observe(target);

        return () => observer.disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [balanceSectionRef?.current]);

    return (
        <AccountDetails
            key={selectedAccount.key}
            selectedAccount={selectedAccount}
            isBalanceShown={isScrolled}
        />
    );
};
