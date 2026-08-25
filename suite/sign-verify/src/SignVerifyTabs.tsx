import { Translation } from '@suite/intl';
import { Box, Row, Tabs } from '@trezor/components';

import { OutcomeBadge } from './OutcomeBadge';
import { type SignVerifyOutcome, type SignVerifyPage } from './types';

const TABS_LABEL_BOTTOM_SPACE = 10;

type SignVerifyTabsProps = {
    page: SignVerifyPage;
    canVerify: boolean;
    outcome: SignVerifyOutcome;
    onPageChange: (page: SignVerifyPage) => void;
};

export const SignVerifyTabs = ({ page, canVerify, outcome, onPageChange }: SignVerifyTabsProps) => (
    <Box position={{ type: 'relative' }} margin={{ bottom: 20 }}>
        <Tabs activeItemId={page} size="large">
            <Tabs.Item
                id="sign"
                onClick={() => onPageChange('sign')}
                data-testid="@sign-verify/navigation/sign"
            >
                <Translation id="TR_SIGN" />
            </Tabs.Item>
            {canVerify && (
                <Tabs.Item
                    id="verify"
                    onClick={() => onPageChange('verify')}
                    data-testid="@sign-verify/navigation/verify"
                >
                    <Translation id="TR_VERIFY" />
                </Tabs.Item>
            )}
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
