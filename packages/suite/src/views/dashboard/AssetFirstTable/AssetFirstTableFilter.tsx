import { useRef } from 'react';

import { Translation } from '@suite/intl';
import {
    Button,
    GhostContainer,
    Icon,
    Menu,
    Popover,
    type PopoverRef,
    Row,
} from '@trezor/components';
import { CheckIcon, FunnelSimpleIcon, XIcon } from '@trezor/icons';

import { type AssetFirstGrouping } from './assetFirstTableUtils';

type AssetFirstTableFilterProps = {
    grouping: AssetFirstGrouping;
    onChange: (grouping: AssetFirstGrouping) => void;
};

export const AssetFirstTableFilter = ({ grouping, onChange }: AssetFirstTableFilterProps) => {
    const popoverRef = useRef<PopoverRef>(null);

    if (grouping === 'networks') {
        return (
            <Button
                size="small"
                intent="info"
                priority="secondary"
                iconRight={XIcon}
                onClick={() => onChange('default')}
                data-testid="@dashboard/asset-first/grouping/clear"
            >
                <Translation id="TR_ASSET_FIRST_GROUPING_NETWORKS" />
            </Button>
        );
    }

    const choose = (chosen: AssetFirstGrouping) => {
        onChange(chosen);
        popoverRef.current?.close();
    };

    return (
        <Popover
            ref={popoverRef}
            placement={{ position: 'bottom', alignment: 'start' }}
            content={
                <Menu
                    onClose={() => popoverRef.current?.close()}
                    items={[
                        {
                            label: <Translation id="TR_ASSET_FIRST_GROUPING_DEFAULT" />,
                            iconRight: CheckIcon,
                            onClick: () => choose('default'),
                            'data-testid': '@dashboard/asset-first/grouping/default',
                        },
                        {
                            label: <Translation id="TR_ASSET_FIRST_GROUPING_NETWORKS" />,
                            onClick: () => choose('networks'),
                            'data-testid': '@dashboard/asset-first/grouping/networks',
                        },
                    ]}
                />
            }
        >
            <GhostContainer
                padding={4}
                borderRadius={6}
                data-testid="@dashboard/asset-first/grouping"
            >
                <Icon as={FunnelSimpleIcon} size={16} intent="neutral" priority="secondary" />
            </GhostContainer>
        </Popover>
    );
};

type AssetFirstTableFilterHeaderProps = AssetFirstTableFilterProps;

export const AssetFirstTableFilterHeader = ({
    grouping,
    onChange,
}: AssetFirstTableFilterHeaderProps) => (
    <Row gap={8} alignItems="center">
        <Translation id="TR_ASSET" />
        <AssetFirstTableFilter grouping={grouping} onChange={onChange} />
    </Row>
);
