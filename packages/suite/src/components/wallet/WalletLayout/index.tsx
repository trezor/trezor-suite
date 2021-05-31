import React from 'react';
import styled from 'styled-components';
import { LayoutContext } from '@suite-components';
import { AccountsMenu } from '@wallet-components';
import Exception from '@wallet-components/AccountException';
import AccountMode from '@wallet-components/AccountMode';
import AccountAnnouncement from '@wallet-components/AccountAnnouncement';
import AccountTopPanel from '@wallet-components/AccountTopPanel';
import { MAX_WIDTH_WALLET_CONTENT } from '@suite-constants/layout';
import { AppState, ExtendedMessageDescriptor } from '@suite-types';
import { useTranslation } from '@suite-hooks/useTranslation';
import { SkeletonRectangle } from '@suite-components/Skeleton';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    max-width: ${MAX_WIDTH_WALLET_CONTENT};
    width: 100%;
    height: 100%;
`;

// This placeholder makes the "Receive" and "Trade" tabs look aligned with other tabs in "Accounts" view,
// which implement some kind of toolbar.
// Height computation: 24px toolbarHeight + 20px marginBottom = 44px;
const EmptyHeaderPlaceholder = styled.div`
    width: 100%;
    height: 44px;
`;

type Props = {
    title: ExtendedMessageDescriptor['id'];
    children?: React.ReactNode;
    account: AppState['wallet']['selectedAccount'];
    showEmptyHeaderPlaceholder?: boolean;
};

const WalletLayout = ({ showEmptyHeaderPlaceholder = false, title, children, account }: Props) => {
    const { setLayout } = React.useContext(LayoutContext);
    const { translationString } = useTranslation();
    const l10nTitle = translationString(title);

    React.useEffect(() => {
        if (setLayout) setLayout(l10nTitle, <AccountsMenu />, <AccountTopPanel />);
    }, [l10nTitle, setLayout]);

    if (account.status === 'loading') {
        return (
            <Wrapper>
                <SkeletonRectangle
                    width="100%"
                    height="300px"
                    animate={account.loader === 'account-loading'}
                />
            </Wrapper>
        );
    }

    if (account.status === 'exception') {
        return (
            <Wrapper>
                <AccountMode mode={account.mode} />
                <AccountAnnouncement selectedAccount={account} />
                <EmptyHeaderPlaceholder />
                <Exception account={account} />
            </Wrapper>
        );
    }

    // if (account.imported) {
    // TODO
    // }

    return (
        <Wrapper>
            <AccountMode mode={account.mode} />
            <AccountAnnouncement selectedAccount={account} />
            {/* <WalletNotifications /> */}
            {showEmptyHeaderPlaceholder && <EmptyHeaderPlaceholder />}
            {children}
        </Wrapper>
    );
};

export default WalletLayout;
