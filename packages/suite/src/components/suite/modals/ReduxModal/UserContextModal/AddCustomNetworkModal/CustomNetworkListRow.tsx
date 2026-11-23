import styled from 'styled-components';

import { Column, Divider, Icon, Row, Text, commonFocusStyles } from '@trezor/components';
import { CaretRightIcon } from '@trezor/icons';

import { type CustomNetworkCatalogueEntry } from '#src/utils/settings/customNetworks/customNetworkCatalogue';

import { CustomNetworkBadges } from './CustomNetworkBadges';
import { CustomNetworkIcon } from './CustomNetworkIcon';
import { CustomNetworkUnsupportedReason } from './CustomNetworkUnsupportedReason';

export const CUSTOM_NETWORK_ROW_HEIGHT = 56;

const RowButton = styled.button`
    display: flex;
    flex: 1;
    align-items: center;
    padding: 0 16px;
    border: 0;
    background: none;
    cursor: pointer;
    text-align: left;
    transition: background 0.2s ease-in-out;
    -webkit-app-region: no-drag;

    &:disabled {
        cursor: default;
    }

    &:hover:not(:disabled) {
        background: ${({ theme }) => theme.elementFillGhostHovered};
    }

    &:focus-visible {
        ${commonFocusStyles}
    }
`;

type CustomNetworkListRowProps = {
    entry: CustomNetworkCatalogueEntry;
    hasDivider: boolean;
    onSelect: (entry: CustomNetworkCatalogueEntry) => void;
};

export const CustomNetworkListRow = ({
    entry,
    hasDivider,
    onSelect,
}: CustomNetworkListRowProps) => {
    const { unsupportedReason } = entry;

    return (
        <Column height={CUSTOM_NETWORK_ROW_HEIGHT} width="100%">
            {hasDivider && <Divider margin={{ top: 0, bottom: 0 }} />}
            <RowButton
                type="button"
                disabled={unsupportedReason !== undefined}
                onClick={() => onSelect(entry)}
                data-testid={`@add-custom-network/network/${entry.definition.chainId}`}
            >
                <Row gap={12} flex="1" minWidth={0}>
                    <CustomNetworkIcon entry={entry} />
                    <Column alignItems="flex-start" minWidth={0}>
                        <Text typographyStyle="body-md" ellipsisLineCount={1}>
                            {entry.definition.name}
                        </Text>
                        {unsupportedReason && (
                            <CustomNetworkUnsupportedReason reason={unsupportedReason} />
                        )}
                    </Column>
                    {!unsupportedReason && <CustomNetworkBadges entry={entry} />}
                </Row>
                {!unsupportedReason && (
                    <Icon as={CaretRightIcon} size={16} intent="neutral" priority="secondary" />
                )}
            </RowButton>
        </Column>
    );
};
