import { type ReactNode, useRef } from 'react';

import { type TranslationKey, useTranslation } from '@suite/intl';
import { Column, SkeletonRectangle } from '@trezor/components';
import { type PrimitiveType, exhaustive } from '@trezor/type-utils';

import { PageHeader } from 'src/components/suite/layouts/SuiteLayout';
import { useLayout } from 'src/hooks/suite';
import { AccountHeaderProvider } from 'src/support/suite/AccountHeaderProvider';
import { type AppState } from 'src/types/suite';

import { AccountBanners } from './AccountBanners/AccountBanners';
import { AccountException } from './AccountException/AccountException';
import { AccountNavigation } from './AccountNavigation';
import { CoinjoinAccountDiscovery } from './CoinjoinAccountDiscovery/CoinjoinAccountDiscovery';

type WalletPageHeaderProps = {
    balanceSectionRef: React.RefObject<HTMLDivElement | null>;
    isSubpage?: boolean;
};

const WalletPageHeader = ({ balanceSectionRef, isSubpage }: WalletPageHeaderProps) => (
    <AccountHeaderProvider balanceSectionRef={balanceSectionRef}>
        <PageHeader />
        {!isSubpage && <AccountNavigation />}
    </AccountHeaderProvider>
);

type WalletBodyProps = {
    account: AppState['wallet']['selectedAccount'];
    children?: ReactNode;
};

const WalletBody = ({ account, children }: WalletBodyProps) => {
    const { status, account: selectedAccount, loader, network } = account;

    switch (status) {
        case 'loading': {
            if (selectedAccount?.accountType === 'coinjoin') {
                return <CoinjoinAccountDiscovery />;
            }

            return (
                <SkeletonRectangle
                    width="100%"
                    height="300px"
                    borderRadius="12px"
                    animate={loader === 'account-loading'}
                />
            );
        }

        case 'exception':
            return children ?? <AccountException loader={loader} network={network} />;

        case 'loaded':
        case 'none':
            return children;

        default:
            return exhaustive(status);
    }
};

type WalletLayoutProps = {
    title: TranslationKey;
    titleValues?: Record<string, PrimitiveType>;
    account: AppState['wallet']['selectedAccount'];
    isSubpage?: boolean;
    children?: ReactNode;
};

export const WalletLayout = ({
    title,
    titleValues,
    account,
    isSubpage,
    children,
}: WalletLayoutProps) => {
    const { translationString } = useTranslation();
    const l10nTitle = translationString(title, titleValues);
    const balanceSectionRef = useRef<HTMLDivElement>(null);

    useLayout(
        l10nTitle,
        <WalletPageHeader balanceSectionRef={balanceSectionRef} isSubpage={isSubpage} />,
    );

    return (
        <AccountHeaderProvider balanceSectionRef={balanceSectionRef}>
            <Column gap={40}>
                <AccountBanners account={account.account} />
                <WalletBody account={account}>{children}</WalletBody>
            </Column>
        </AccountHeaderProvider>
    );
};
