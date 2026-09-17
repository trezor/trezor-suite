import { useRef } from 'react';

import styled from 'styled-components';

import { Translation, useTranslation } from '@suite/intl';
import { Button, Icon, Menu, Popover, type PopoverRef, Row } from '@trezor/components';
import { CheckIcon, FunnelSimpleIcon, XIcon } from '@trezor/icons';

import { type AssetFirstGrouping } from './assetFirstTableGrouping';

/**
 * The funnel is a mark in the heading rather than a button sitting in it, so it carries no shape
 * of its own — `Dropdown` would bring an `IconButton` and its filled background.
 */
const FunnelTrigger = styled.button`
    display: flex;
    align-items: center;
    border: none;
    background: none;
    padding: 0;
    cursor: pointer;
`;

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
    const popoverRef = useRef<PopoverRef>(null);
    const { translationString } = useTranslation();

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
            <FunnelTrigger
                type="button"
                aria-label={translationString('TR_ASSET_FIRST_GROUPING')}
                data-testid="@dashboard/asset-first/grouping"
            >
                <Icon as={FunnelSimpleIcon} size={16} intent="neutral" priority="secondary" />
            </FunnelTrigger>
        </Popover>
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
