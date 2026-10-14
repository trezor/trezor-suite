import { Translation } from '@suite/intl';
import { Button, Table } from '@trezor/components';

type HomeAssetExpandRowProps = {
    isExpanded: boolean;
    onToggle: () => void;
};

export const HomeAssetExpandRow = ({ isExpanded, onToggle }: HomeAssetExpandRowProps) => (
    <Table.Row isHighlightedOnHover={false}>
        <Table.Cell
            colSpan={3}
            align="center"
            maxWidth="100%"
            padding={{ vertical: 16, horizontal: 20 }}
        >
            <Button
                size="small"
                intent="neutral"
                priority="secondary"
                onClick={onToggle}
                data-testid="@dashboard/home-asset/expand"
            >
                <Translation id={isExpanded ? 'TR_SHOW_LESS' : 'TR_SHOW_MORE'} />
            </Button>
        </Table.Cell>
    </Table.Row>
);
