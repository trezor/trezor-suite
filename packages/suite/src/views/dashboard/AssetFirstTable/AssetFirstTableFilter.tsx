import { Translation, useTranslation } from '@suite/intl';
import { Button, Dropdown, Row } from '@trezor/components';
import { CheckIcon, FunnelSimpleIcon, XIcon } from '@trezor/icons';

import { type AssetFirstGrouping } from './assetFirstTableGrouping';

type AssetFirstTableFilterProps = {
    grouping: AssetFirstGrouping;
    onChange: (grouping: AssetFirstGrouping) => void;
};

/**
 * How the rows are arranged, beside the column they are arranged by.
 *
 * While the default is in force there is only the funnel; once a grouping is chosen it names
 * itself, so the table says what it is doing without the menu having to be opened again.
 */
export const AssetFirstTableFilter = ({ grouping, onChange }: AssetFirstTableFilterProps) => {
    const { translationString } = useTranslation();

    if (grouping === 'networks') {
        return (
            <Button
                size="small"
                intent="brand"
                priority="secondary"
                iconRight={XIcon}
                onClick={() => onChange('default')}
                data-testid="@dashboard/asset-first/grouping/clear"
            >
                <Translation id="TR_ASSET_FIRST_GROUPING_NETWORKS" />
            </Button>
        );
    }

    return (
        <Dropdown
            icon={FunnelSimpleIcon}
            iconSize="small"
            data-testid="@dashboard/asset-first/grouping"
            tooltip={{ isActive: true, content: translationString('TR_ASSET_FIRST_GROUPING') }}
            items={[
                {
                    label: <Translation id="TR_ASSET_FIRST_GROUPING_DEFAULT" />,
                    iconRight: CheckIcon,
                    onClick: () => onChange('default'),
                    'data-testid': '@dashboard/asset-first/grouping/default',
                },
                {
                    label: <Translation id="TR_ASSET_FIRST_GROUPING_NETWORKS" />,
                    onClick: () => onChange('networks'),
                    'data-testid': '@dashboard/asset-first/grouping/networks',
                },
            ]}
        />
    );
};

type AssetFirstTableFilterHeaderProps = AssetFirstTableFilterProps;

/** The "Asset" column heading, with the filter beside it. */
export const AssetFirstTableFilterHeader = ({
    grouping,
    onChange,
}: AssetFirstTableFilterHeaderProps) => (
    <Row gap={8} alignItems="center">
        <Translation id="TR_ASSET" />
        <AssetFirstTableFilter grouping={grouping} onChange={onChange} />
    </Row>
);
