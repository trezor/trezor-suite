import { use } from 'react';

import { Badge, HStack, SubTabs } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { throwError } from '@trezor/utils';

import { SignVerifyContext, type SignVerifyPage } from './SignVerifyContext';

type SignVerifyTabsProps = {
    pages: SignVerifyPage[];
};

export const SignVerifyTabs = ({ pages }: SignVerifyTabsProps) => {
    const { page, changePage, outcome } =
        use(SignVerifyContext) ?? throwError('Missing SignVerify');

    const items = pages.map(value => ({
        value,
        label: (
            <Translation
                id={value === 'sign' ? 'signAndVerify.tabs.sign' : 'signAndVerify.tabs.verify'}
            />
        ),
    }));

    return (
        <HStack alignItems="center" justifyContent="space-between">
            <SubTabs items={items} onChange={changePage} value={page} />
            {outcome === 'signed' && (
                <Badge
                    icon="check"
                    label={<Translation id="signAndVerify.results.signed" />}
                    intent="brand"
                />
            )}
            {outcome === 'verified' && (
                <Badge
                    icon="check"
                    label={<Translation id="signAndVerify.results.verified" />}
                    intent="brand"
                />
            )}
            {outcome === 'failed' && (
                <Badge
                    icon="warningCircle"
                    label={<Translation id="signAndVerify.results.failed" />}
                    intent="critical"
                />
            )}
        </HStack>
    );
};
