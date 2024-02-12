import { ReactNode } from 'react';
import styled from 'styled-components';

import { SkeletonRectangle } from '@trezor/components';
import { AppState, ExtendedMessageDescriptor } from 'src/types/suite';
import { useTranslation, useLayout } from 'src/hooks/suite';
import { PageHeader } from 'src/components/suite/Preloader/SuiteLayout/PageHeader/PageHeader';

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
    showEmptyHeaderPlaceholder?: boolean; // TODO: remove this, it's not even used according to it's name (account details)
    className?: string;
    children?: ReactNode;
};

export const WalletLayout = ({
    showEmptyHeaderPlaceholder = false,
    title,
    account,
    className,
    children,
}: WalletLayoutProps) => {
    const { translationString } = useTranslation();
    const l10nTitle = translationString(title);

    useLayout(l10nTitle, PageHeader);

    const { status, account: selectedAccount, loader, network } = account;

    let pageContent;

    if (status === 'loading') {
        if (selectedAccount?.accountType === 'coinjoin') {
            pageContent = (
                <>
                    <AccountBanners account={selectedAccount} />
                    {showEmptyHeaderPlaceholder && <EmptyHeaderPlaceholder />}
                    <CoinjoinAccountDiscovery />
                </>
            );
        } else {
            pageContent = (
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
        pageContent = (
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

    return (
        <>
            <AccountTopPanel />
            <AccountNavigation />
            {pageContent}
        </>
    );
};
