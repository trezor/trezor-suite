import { Translation } from '@suite/intl';
import { Box, Button, Table } from '@trezor/components';
type AssetFirstExpandRowProps = {
    isExpanded: boolean;
    onToggle: () => void;
};

export const AssetFirstExpandRow = ({ isExpanded, onToggle }: AssetFirstExpandRowProps) => (
    <Table.Row isHighlightedOnHover={false}>
        <Table.Cell
            colSpan={3}
            align="center"
            maxWidth="100%"
            padding={{ vertical: 16, horizontal: 20 }}
        >
            {/* The design system's button has no outlined variant, and inside a table a
                button with no outline reads as another row of it, so the outline is drawn
                around the button rather than on it. */}
            <Box borderColor="borderNeutral" borderWidth={1} borderRadius={8} display="inline-flex">
                <Button
                    size="small"
                    intent="neutral"
                    priority="secondary"
                    onClick={onToggle}
                    data-testid="@dashboard/asset-first/expand"
                >
                    <Translation id={isExpanded ? 'TR_SHOW_LESS' : 'TR_SHOW_MORE'} />
                </Button>
            </Box>
        </Table.Cell>
    </Table.Row>
);
