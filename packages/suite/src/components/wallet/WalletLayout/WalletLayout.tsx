import { ReactNode } from 'react';
import styled from 'styled-components';

import { SkeletonRectangle } from '@trezor/components';
import { AppState, ExtendedMessageDescriptor } from 'src/types/suite';
import { useTranslation, useLayout } from 'src/hooks/suite';
import { PageHeader } from 'src/components/suite/layouts/SuiteLayout';

import { AccountBanners } from './AccountBanners/AccountBanners';
import { AccountException } from './AccountException/AccountException';
import { CoinjoinAccountDiscovery } from './CoinjoinAccountDiscovery/CoinjoinAccountDiscovery';
import { AccountTopPanel } from './AccountTopPanel/AccountTopPanel';
import { AccountNavigation } from './AccountTopPanel/AccountNavigation';

// This placeholder makes the "Receive" and "Trade" tabs look aligned with other tabs in "Accounts" view,
// which implement some kind of toolbar.
// Height computation: 24px toolbarHeight + 20px marginBottom = 44px;
const EmptyHeaderPlaceholder = styled.div`
    width: 100%;
    height: 44px;
`;

type WalletLayoutProps = {
    title: ExtendedMessageDescriptor['id'];
    account: AppState['wallet']['selectedAccount'];
    isSubpage?: boolean;
    showEmptyHeaderPlaceholder?: boolean;
    className?: string;
    children?: ReactNode;
};

export const WalletLayout = ({
    showEmptyHeaderPlaceholder = false,
    title,
    account,
    isSubpage,
    className,
    children,
}: WalletLayoutProps) => {
    const { translationString } = useTranslation();
    const l10nTitle = translationString(title);

    useLayout(l10nTitle, PageHeader);

    const { status, account: selectedAccount, loader, network } = account;

    const getPageContent = () => {
        if (status === 'loading') {
            if (selectedAccount?.accountType === 'coinjoin') {
                return (
                    <>
                        <AccountBanners account={selectedAccount} />
                        {showEmptyHeaderPlaceholder && <EmptyHeaderPlaceholder />}
                        <CoinjoinAccountDiscovery />
                    </>
                );
            } else {
                return (
                    <>
                        {showEmptyHeaderPlaceholder && <EmptyHeaderPlaceholder />}
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
                    {showEmptyHeaderPlaceholder && <EmptyHeaderPlaceholder />}
                    {status === 'exception' ? (
                        <AccountException loader={loader} network={network} />
                    ) : (
                        <div className={className}>{children}</div>
                    )}
                </>
            );
        }
    };

    const pageContent = getPageContent();

    return (
        <>
            {!isSubpage && (
                <>
                    <AccountTopPanel />
                    <AccountNavigation />
                </>
            )}
            {pageContent}
        </>
    );
};
