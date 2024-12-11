import { ReactNode } from 'react';

import { SkeletonRectangle, Column } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { AppState } from 'src/types/suite';
import { useTranslation, useLayout } from 'src/hooks/suite';
import { PageHeader } from 'src/components/suite/layouts/SuiteLayout';
import { TranslationKey } from 'src/components/suite/Translation';

import { AccountBanners } from './AccountBanners/AccountBanners';
import { AccountException } from './AccountException/AccountException';
import { CoinjoinAccountDiscovery } from './CoinjoinAccountDiscovery/CoinjoinAccountDiscovery';
import { AccountTopPanel } from './AccountTopPanel/AccountTopPanel';
import { AccountNavigation } from './AccountTopPanel/AccountNavigation';

type WalletPageHeaderProps = {
    isSubpage?: boolean;
};

const WalletPageHeader = ({ isSubpage }: WalletPageHeaderProps) => {
    return (
        <>
            <PageHeader />
            {!isSubpage && <AccountTopPanel />}
            {!isSubpage && <AccountNavigation />}
        </>
    );
};

type WalletLayoutProps = {
    title: TranslationKey;
    account: AppState['wallet']['selectedAccount'];
    isSubpage?: boolean;
    children?: ReactNode;
};

export const WalletLayout = ({ title, account, isSubpage, children }: WalletLayoutProps) => {
    const { translationString } = useTranslation();
    const l10nTitle = translationString(title);

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
