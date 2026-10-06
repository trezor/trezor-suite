import { useMemo, useState } from 'react';

import { isVerifySupported } from '@suite-common/sign-verify';
import type { Account } from '@suite-common/wallet-types';
import { Badge, HStack, type SubTabItem, SubTabs, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { SignMessageCard } from './SignMessageCard';
import { VerifyMessageCard } from './VerifyMessageCard';
import { useSignMessageForm } from '../hooks/useSignMessageForm';
import { useVerifyMessageForm } from '../hooks/useVerifyMessageForm';

type Tab = 'sign' | 'verify';

type SignAndVerifyFormsProps = {
    account: Account;
};

export const SignAndVerifyForms = ({ account }: SignAndVerifyFormsProps) => {
    const tabs = useMemo(() => {
        const signTab: SubTabItem<Tab> = {
            value: 'sign',
            label: <Translation id="signAndVerify.tabs.sign" />,
        };
        const verifyTab: SubTabItem<Tab> = {
            value: 'verify',
            label: <Translation id="signAndVerify.tabs.verify" />,
        };

        return isVerifySupported(account) ? [signTab, verifyTab] : [signTab];
    }, [account]);
    const [activeTab, setActiveTab] = useState<Tab>('sign');

    const signMessageForm = useSignMessageForm(account);
    const verifyMessageForm = useVerifyMessageForm(account);

    return (
        <VStack spacing="sp16">
            <HStack alignItems="center" justifyContent="space-between">
                <SubTabs items={tabs} onChange={setActiveTab} value={activeTab} />
                {activeTab === 'sign' && signMessageForm.isSigned && (
                    <Badge
                        icon="check"
                        label={<Translation id="signAndVerify.results.signed" />}
                        intent="brand"
                    />
                )}
                {activeTab === 'verify' && verifyMessageForm.isVerified && (
                    <Badge
                        icon="check"
                        label={<Translation id="signAndVerify.results.verified" />}
                        intent="brand"
                    />
                )}
                {activeTab === 'verify' && verifyMessageForm.isFailed && (
                    <Badge
                        icon="warningCircle"
                        label={<Translation id="signAndVerify.results.failed" />}
                        intent="critical"
                    />
                )}
            </HStack>
            {activeTab === 'sign' && <SignMessageCard form={signMessageForm} />}
            {activeTab === 'verify' && <VerifyMessageCard form={verifyMessageForm} />}
        </VStack>
    );
};
