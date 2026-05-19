import { Translation } from '@suite/intl';
import { Banner, Table } from '@trezor/components';

type EarnYieldErrorStateProps = {
    isCardLayout: boolean;
    onRetry: () => void;
};

export const EarnYieldErrorState = ({ isCardLayout, onRetry }: EarnYieldErrorStateProps) => {
    const banner = (
        <Banner
            icon
            intent="warning"
            title={<Translation id="TR_EARN_YIELD_LOAD_ERROR_TITLE" />}
            description={<Translation id="TR_EARN_YIELD_LOAD_ERROR_DESCRIPTION" />}
            rightContent={
                <Banner.Button onClick={onRetry}>
                    <Translation id="TR_TRY_AGAIN" />
                </Banner.Button>
            }
        />
    );

    if (isCardLayout) return banner;

    return (
        <Table.Body>
            <Table.Row>
                <Table.Cell colSpan={5}>{banner}</Table.Cell>
            </Table.Row>
        </Table.Body>
    );
};
