import { useEffect, useState } from 'react';

import { selectRouteName } from '@suite/router';
import { type Account } from '@suite-common/wallet-types';

import { HEADER_HEIGHT } from 'src/constants/suite/layout';
import { useSelector } from 'src/hooks/suite';
import { useOptionalAccountHeaderContext } from 'src/support/suite/AccountHeaderProvider';

import { AccountDetails } from './AccountDetails';

interface AccountNameProps {
    selectedAccount: Account;
}

export const AccountName = ({ selectedAccount }: AccountNameProps) => {
    const [isScrolled, setIsScrolled] = useState(false);
    const routeName = useSelector(selectRouteName);
    const accountHeaderContext = useOptionalAccountHeaderContext();
    const balanceSectionRef = accountHeaderContext?.balanceSectionRef;
    const isOverviewRoute = routeName === 'wallet-index';

    useEffect(() => {
        if (!isOverviewRoute) {
            setIsScrolled(true);

            return;
        }

        const target = balanceSectionRef?.current;
        if (!target) {
            setIsScrolled(false);

            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsScrolled(!entry.isIntersecting);
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
    }, [balanceSectionRef?.current, isOverviewRoute]);

    return (
        <AccountDetails
            key={selectedAccount.key}
            selectedAccount={selectedAccount}
            isBalanceShown={isScrolled}
        />
    );
};
