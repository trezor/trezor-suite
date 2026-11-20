import { use } from 'react';

import { Translation } from '@suite/intl';
import { Tabs } from '@trezor/components';
import { throwError } from '@trezor/utils';

import { SignVerifyContext, type SignVerifyPage } from './SignVerifyContext';

type SignVerifyTabProps = {
    page: SignVerifyPage;
};

export const SignVerifyTab = ({ page }: SignVerifyTabProps) => {
    const { changePage } = use(SignVerifyContext) ?? throwError('Missing SignVerify');

    return (
        <Tabs.Item
            id={page}
            onClick={() => changePage(page)}
            data-testid={`@sign-verify/navigation/${page}`}
        >
            <Translation id={page === 'sign' ? 'TR_SIGN' : 'TR_VERIFY'} />
        </Tabs.Item>
    );
};
