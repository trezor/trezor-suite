import { type ReactNode } from 'react';

import { type TranslationKey, useTranslation } from '@suite/intl';
import { Column, SkeletonRectangle } from '@trezor/components';
import { type PrimitiveType, exhaustive } from '@trezor/type-utils';

import { PageHeader } from 'src/components/suite/layouts/SuiteLayout';
import { useLayout } from 'src/hooks/suite';
import { AccountHeaderProvider } from 'src/support/suite/AccountHeaderProvider';
import { type AppState } from 'src/types/suite';

import { AccountBanners } from './AccountBanners/AccountBanners';
import { AccountException } from './AccountException/AccountException';
import { AccountNavigation } from './AccountTopPanel/AccountNavigation';
import { AccountTopPanel } from './AccountTopPanel/AccountTopPanel';
import { CoinjoinAccountDiscovery } from './CoinjoinAccountDiscovery/CoinjoinAccountDiscovery';

type WalletPageHeaderProps = {
    isSubpage?: boolean;
};

const WalletPageHeader = ({ isSubpage }: WalletPageHeaderProps) => (
    <AccountHeaderProvider>
        <PageHeader />
        {!isSubpage && (
            <>
                <AccountTopPanel />
                <AccountNavigation />
            </>
        )}
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

    useLayout(l10nTitle, <WalletPageHeader isSubpage={isSubpage} />);

    return (
        <Column gap={40}>
            <AccountBanners account={account.account} />
            <WalletBody account={account}>{children}</WalletBody>
        </Column>
    );
};
