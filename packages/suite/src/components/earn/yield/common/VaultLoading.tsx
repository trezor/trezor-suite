import { Card, Column, Spinner } from '@trezor/components';

export const VaultLoading = () => (
    <Card>
        <Column alignItems="center" padding={{ vertical: 80 }}>
            <Spinner size={48} />
        </Column>
    </Card>
);
