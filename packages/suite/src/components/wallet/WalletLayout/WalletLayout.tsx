import { ReactNode } from 'react';

import { TranslationKey, useTranslation } from '@suite/intl';
import { Column, SkeletonRectangle } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { PrimitiveType } from '@trezor/type-utils';

import { PageHeader } from 'src/components/suite/layouts/SuiteLayout';
import { useLayout } from 'src/hooks/suite';
import { AccountHeaderProvider } from 'src/support/suite/AccountHeaderProvider';
import { AppState } from 'src/types/suite';

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
        {!isSubpage && <AccountTopPanel />}
        {!isSubpage && <AccountNavigation />}
    </AccountHeaderProvider>
);

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

    const { status, account: selectedAccount, loader, network } = account;

    const getPageContent = () => {
        if (status === 'loading') {
            if (selectedAccount?.accountType === 'coinjoin') {
                return (
                    <>
                        <AccountBanners account={selectedAccount} />
                        <CoinjoinAccountDiscovery />
                    </>
                );
            } else {
                return (
                    <>
                        <SkeletonRectangle
                            width="100%"
                            height="300px"
                            borderRadius="12px"
                            animate={loader === 'account-loading'}
                        />
                    </>
                );
            }
        } else {
            return (
                <>
                    <AccountBanners account={selectedAccount} />
                    {status === 'exception' ? (
                        <AccountException loader={loader} network={network} />
                    ) : (
                        children
                    )}
                </>
            );
        }
    };

    return <Column gap={spacings.xxxl}>{getPageContent()}</Column>;
};
