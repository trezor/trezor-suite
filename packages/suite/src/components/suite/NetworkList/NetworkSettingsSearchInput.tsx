import { type ReactElement } from 'react';

import { useTranslation } from '@suite/intl';
import { Icon, Input, Row } from '@trezor/components';
import { MagnifyingGlassIcon } from '@trezor/icons';

import { AddCustomNetworkButton } from './AddCustomNetworkButton';

type NetworkSettingsSearchInputProps = {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    onSearchClear: () => void;
    dataTestId?: string;
    rightContent?: ReactElement;
    onAddNetworkClick?: () => void;
};

export const NetworkSettingsSearchInput = ({
    searchQuery,
    onSearchChange,
    onSearchClear,
    dataTestId = '@settings-coins/network-search-input',
    rightContent,
    onAddNetworkClick,
}: NetworkSettingsSearchInputProps) => {
    const { translationString } = useTranslation();

    const input = (
        <Input
            value={searchQuery}
            onChange={event => onSearchChange(event.target.value)}
            onClear={onSearchClear}
            placeholder={translationString('TR_SEARCH_NETWORK')}
            showClearButton
            width="100%"
            data-testid={dataTestId}
            leftContent={
                <Icon as={MagnifyingGlassIcon} intent="neutral" priority="secondary" size={16} />
            }
            rightContent={searchQuery ? undefined : rightContent}
        />
    );

    if (!onAddNetworkClick) {
        return input;
    }

    return (
        <Row gap={8} width="100%" alignItems="center">
            {input}
            <AddCustomNetworkButton onClick={onAddNetworkClick} />
        </Row>
    );
};
