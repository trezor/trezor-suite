import { Row, Spinner, Table } from '@trezor/components';

type EarnYieldLoadingStateProps = {
    isCardLayout: boolean;
};

export const EarnYieldLoadingState = ({ isCardLayout }: EarnYieldLoadingStateProps) => {
    const spinner = (
        <Row width="100%" justifyContent="center" padding={{ vertical: 16 }}>
            <Spinner size={24} />
        </Row>
    );

    if (isCardLayout) return spinner;

    return (
        <Table.Body>
            <Table.Row>
                <Table.Cell colSpan={5}>{spinner}</Table.Cell>
            </Table.Row>
        </Table.Body>
    );
};
