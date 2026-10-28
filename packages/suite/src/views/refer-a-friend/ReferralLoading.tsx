import { Card, Column, Spinner } from '@trezor/components';

export const ReferralLoading = () => (
    <Card data-testid="@referral/loading">
        <Column padding={{ vertical: 32 }} alignItems="center">
            <Spinner />
        </Column>
    </Card>
);
