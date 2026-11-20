import { type ReactNode, use } from 'react';

import { Box, Row, Tabs } from '@trezor/components';
import { throwError } from '@trezor/utils';

import { OutcomeBadge } from './OutcomeBadge';
import { SignVerifyContext } from './SignVerifyContext';

const TABS_LABEL_BOTTOM_SPACE = 10;

type SignVerifyTabsProps = {
    children: ReactNode;
};

export const SignVerifyTabs = ({ children }: SignVerifyTabsProps) => {
    const { page, outcome } = use(SignVerifyContext) ?? throwError('Missing SignVerify');

    return (
        <Box position={{ type: 'relative' }} margin={{ bottom: 20 }}>
            <Tabs activeItemId={page} size="large">
                {children}
            </Tabs>
            {outcome !== 'idle' && (
                <Row
                    position={{
                        type: 'absolute',
                        top: 0,
                        right: 0,
                        bottom: TABS_LABEL_BOTTOM_SPACE,
                    }}
                >
                    <OutcomeBadge outcome={outcome} />
                </Row>
            )}
        </Box>
    );
};
