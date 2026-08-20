import { memo, useCallback, useMemo, useRef } from 'react';

import { Translation, type TranslationKey, useTranslation } from '@suite/intl';
import { isNetworkIconSymbol } from '@suite-common/icons';
import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import {
    Box,
    Button,
    type DropdownMenuItemProps,
    Icon,
    Input,
    Menu,
    Popover,
    type PopoverRef,
    Row,
    Text,
} from '@trezor/components';
import { CaretDownIcon, MagnifyingGlassIcon } from '@trezor/icons';
import { NetworkIcon, TokenIcon } from '@trezor/product-components';
import { zIndices } from '@trezor/theme';

const DATA_TESTID_BASE = '@asset-picker/search';
const SEARCH_HEIGHT = 44;

const NetworkLabel = ({ symbol, name }: { symbol: NetworkSymbol; name: string }) => (
    <Row gap={8}>
        {isNetworkIconSymbol(symbol) ? (
            <NetworkIcon size={20} networkSymbol={symbol} />
        ) : (
            <TokenIcon size={20} symbol={symbol} />
        )}
        <Text typographyStyle="body-sm" textWrap="nowrap">
            {name}
        </Text>
    </Row>
);

export type AssetPickerSearchHeaderProps = {
    placeholder: TranslationKey;
    search: string;
    setSearch: (search: string) => void;
    networkFilter: NetworkSymbol | undefined;
    setNetworkFilter: (networkFilter: NetworkSymbol | undefined) => void;
    networks: NetworkSymbol[];
    autoFocus?: boolean;
};

export const AssetPickerSearchHeader = memo(function AssetPickerSearchHeaderInner({
    placeholder,
    search,
    setSearch,
    networkFilter,
    setNetworkFilter,
    networks,
    autoFocus,
}: AssetPickerSearchHeaderProps) {
    const { translationString } = useTranslation();
    const popoverRef = useRef<PopoverRef>(null);

    const closePopover = useCallback(() => popoverRef.current?.close(), []);

    const items = useMemo<DropdownMenuItemProps[]>(
        () => [
            {
                label: (
                    <Text typographyStyle="body-sm" textWrap="nowrap">
                        <Translation id="TR_ALL_NETWORKS" />
                    </Text>
                ),
                onClick: () => setNetworkFilter(undefined),
                'data-testid': `${DATA_TESTID_BASE}/filter/select-option/all-networks`,
            },
            ...networks.map(symbol => ({
                label: <NetworkLabel symbol={symbol} name={getNetwork(symbol).name} />,
                onClick: () => setNetworkFilter(symbol),
                'data-testid': `${DATA_TESTID_BASE}/filter/select-option/${symbol}`,
            })),
        ],
        [networks, setNetworkFilter],
    );

    return (
        <Row gap={12} alignItems="center" padding={{ horizontal: 16 }}>
            <Box
                flex="1"
                minWidth={0}
                height={SEARCH_HEIGHT}
                borderRadius={12}
                backgroundColor="surfaceFillRaised"
                padding={{ horizontal: 16 }}
            >
                <Row height="100%" gap={16}>
                    <Icon
                        as={MagnifyingGlassIcon}
                        intent="neutral"
                        priority="secondary"
                        size={16}
                    />
                    <Input
                        isClean
                        size="small"
                        data-testid={`${DATA_TESTID_BASE}/input`}
                        placeholder={translationString(placeholder)}
                        value={search}
                        onChange={event => setSearch(event.target.value)}
                        onClear={() => setSearch('')}
                        width="100%"
                        // eslint-disable-next-line jsx-a11y/no-autofocus
                        autoFocus={autoFocus}
                        onBlur={() => {
                            const trimmedSearch = search.trim();

                            if (trimmedSearch !== search) {
                                setSearch(trimmedSearch);
                            }
                        }}
                    />
                </Row>
            </Box>

            <Popover
                ref={popoverRef}
                placement={{ position: 'bottom', alignment: 'end' }}
                zIndex={zIndices.modal + 1}
                content={<Menu items={items} onClose={closePopover} maxHeight={300} />}
            >
                <Button
                    size="large"
                    intent="neutral"
                    priority="secondary"
                    iconRight={CaretDownIcon}
                    data-testid={`${DATA_TESTID_BASE}/filter`}
                >
                    {networkFilter ? (
                        <Row
                            data-testid={`${DATA_TESTID_BASE}/filter/select-option-value/${networkFilter}`}
                        >
                            {isNetworkIconSymbol(networkFilter) ? (
                                <NetworkIcon size={20} networkSymbol={networkFilter} />
                            ) : (
                                <TokenIcon size={20} symbol={networkFilter} />
                            )}
                        </Row>
                    ) : (
                        <Translation id="TR_ASSET_PICKER_NETWORK_FILTER" />
                    )}
                </Button>
            </Popover>
        </Row>
    );
});
