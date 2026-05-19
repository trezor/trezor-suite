import { Translation } from '@suite/intl';
import { Paragraph, Table } from '@trezor/components';

type EarnYieldEmptyStateProps = {
    isCardLayout: boolean;
};

export const EarnYieldEmptyState = ({ isCardLayout }: EarnYieldEmptyStateProps) => {
    const message = (
        <Paragraph typographyStyle="body-md" intent="neutral" priority="secondary">
            <Translation id="TR_ACCOUNT_NO_ACCOUNTS" />
        </Paragraph>
    );

    if (isCardLayout) return message;

    return (
        <Table.Body>
            <Table.Row>
                <Table.Cell colSpan={5}>{message}</Table.Cell>
            </Table.Row>
        </Table.Body>
    );
};
