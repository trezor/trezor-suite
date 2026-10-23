import { type ComponentType, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectFullSelectedAccount } from '@suite/account';
import { useDevice } from '@suite/device';
import type { Account, SelectedAccountStatus } from '@suite-common/wallet-types';

import { isTranslationKey } from './CapabilityLabel';
import { SignVerifyForm } from './SignVerifyForm';
import { type SignVerifyLayoutProps } from './SignVerifyLayoutProps';
import { type SignVerifyTab } from './types';
import { useAccountMessageSigning } from './useAccountMessageSigning';

type SignVerifyPageProps = {
    LayoutComponent: ComponentType<SignVerifyLayoutProps>;
};

type SignVerifyAccountPageProps = SignVerifyPageProps & {
    account: Account;
    selectedAccount: SelectedAccountStatus;
};

const SignVerifyAccountPage = ({
    LayoutComponent,
    account,
    selectedAccount,
}: SignVerifyAccountPageProps) => {
    const [tab, setTab] = useState<SignVerifyTab>('sign');
    const messageSigning = useAccountMessageSigning(account);
    const { device, isLocked } = useDevice();

    // The menu offers this page only for accounts whose network signs messages.
    if (messageSigning === undefined) {
        return null;
    }

    const { title } = messageSigning.labels;

    return (
        <LayoutComponent
            account={selectedAccount}
            title={isTranslationKey(title.id) ? title.id : 'TR_NAV_SIGN_VERIFY'}
            isDeviceConnected={Boolean(device?.connected && device?.available)}
        >
            {/* Each tab of each account is a form of its own: keying it throws away everything
            the previous one was in the middle of, including the outcome it had reached. */}
            <SignVerifyForm
                key={`${tab}-${account.key}`}
                account={account}
                messageSigning={messageSigning}
                isDeviceLocked={isLocked()}
                page={tab}
                onPageChange={setTab}
            />
        </LayoutComponent>
    );
};

export const SignVerifyPage = ({ LayoutComponent }: SignVerifyPageProps) => {
    const selectedAccount = useSelector(selectFullSelectedAccount);
    const { account } = selectedAccount;

    if (account === undefined) {
        return null;
    }

    return (
        <SignVerifyAccountPage
            LayoutComponent={LayoutComponent}
            account={account}
            selectedAccount={selectedAccount}
        />
    );
};
