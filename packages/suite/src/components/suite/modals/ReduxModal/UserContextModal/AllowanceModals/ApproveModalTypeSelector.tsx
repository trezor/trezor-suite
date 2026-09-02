import { useRef } from 'react';

import { type DexApprovalType } from 'invity-api';

import { Translation, type TranslationKey } from '@suite/intl';
import { type NetworkSymbol, getDisplaySymbol } from '@suite-common/wallet-config';
import { type AmountSubunit, subunitsToUnits } from '@suite-common/wallet-utils';
import { type TokenInfo } from '@trezor/blockchain-link-types';
import {
    CardList,
    Column,
    Icon,
    Menu,
    Paragraph,
    Popover,
    type PopoverRef,
    Row,
    Text,
} from '@trezor/components';
import { CaretDownIcon, WarningIcon } from '@trezor/icons';
import { TokenIcon } from '@trezor/product-components';
import { zIndices } from '@trezor/theme';

import type { AllowanceModalProvider } from './AllowanceModalProviderInfo';

interface ApproveModalTypeSelectorProps {
    approvalType: DexApprovalType;
    isLoading: boolean;
    data: string;
    networkSymbol: NetworkSymbol;
    onSelect: (type: DexApprovalType) => void;
    provider: AllowanceModalProvider;
    token: TokenInfo;
    displayAmount: AmountSubunit;
    hasPreapprovedAmount: boolean;
}

type SelectableType = Extract<DexApprovalType, 'INFINITE' | 'MINIMAL'>;

const TYPE_LABEL_ID = {
    INFINITE: 'TR_APPROVAL_VALUE_INFINITE',
    MINIMAL: 'TR_APPROVAL_VALUE_MINIMAL',
} as const satisfies Record<SelectableType, TranslationKey>;

const TYPE_INFO_ID = {
    INFINITE: 'TR_APPROVAL_VALUE_INFINITE_INFO',
    MINIMAL: 'TR_APPROVAL_VALUE_MINIMAL_INFO',
} as const satisfies Record<SelectableType, TranslationKey>;

const toSelectable = (type: DexApprovalType): SelectableType =>
    type === 'INFINITE' ? 'INFINITE' : 'MINIMAL';

export const ApproveModalTypeSelector = ({
    approvalType,
    isLoading,
    networkSymbol,
    onSelect,
    provider,
    token,
    displayAmount,
    hasPreapprovedAmount,
}: ApproveModalTypeSelectorProps) => {
    const popoverRef = useRef<PopoverRef>(null);
    const displaySymbol = token.symbol
        ? getDisplaySymbol(token.symbol, token.contract)
        : token.name;

    const translationValues = {
        value: subunitsToUnits({ value: displayAmount, decimals: token.decimals }).toString(),
        send: displaySymbol,
        provider: provider.name,
    };

    const handleSelect = (type: DexApprovalType) => {
        onSelect(type);
        popoverRef.current?.close();
    };

    const renderDetails = (type: SelectableType) => (
        <>
            <Paragraph typographyStyle="body-sm" intent="neutral" priority="secondary">
                <Translation id={TYPE_INFO_ID[type]} values={translationValues} />
            </Paragraph>
            {type === 'INFINITE' && (
                <Text intent="warning" typographyStyle="body-sm">
                    <Row gap={8}>
                        <Icon as={WarningIcon} size={16} />
                        <Translation
                            id="TR_APPROVAL_VALUE_INFINITE_WARNING"
                            values={{ send: displaySymbol }}
                        />
                    </Row>
                </Text>
            )}
        </>
    );

    const renderOption = (type: SelectableType) => (
        <CardList.Item
            key={type}
            onClick={() => handleSelect(type)}
            width="100%"
            data-testid={`@modal/approve/${type.toLowerCase()}-option`}
        >
            <Column gap={4} flex="1" alignItems="flex-start">
                <Row gap={8}>
                    <TokenIcon
                        symbol={networkSymbol}
                        contractAddress={token.contract}
                        size={20}
                        placeholder={displaySymbol}
                    />
                    <Text typographyStyle="body-sm-strong">
                        <Translation id={TYPE_LABEL_ID[type]} values={translationValues} />
                    </Text>
                </Row>
                {renderDetails(type)}
            </Column>
        </CardList.Item>
    );

    const selectedType = toSelectable(approvalType);
    const trigger = (
        <CardList.Item isDisabled={isLoading} width="100%">
            <Column gap={4} flex="1">
                <Row justifyContent="space-between" width="100%" gap={12}>
                    <Text typographyStyle="body-sm">
                        <Translation
                            id={
                                hasPreapprovedAmount ? 'TR_APPROVAL_NEW_LIMIT' : 'TR_APPROVAL_LIMIT'
                            }
                        />
                    </Text>
                    <Row gap={8}>
                        <TokenIcon
                            symbol={networkSymbol}
                            contractAddress={token.contract}
                            size={20}
                            placeholder={displaySymbol}
                        />
                        <Text
                            typographyStyle="body-sm-strong"
                            data-testid="@modal/approve/limit-value"
                        >
                            <Translation
                                id={TYPE_LABEL_ID[selectedType]}
                                values={translationValues}
                            />
                        </Text>
                        <Icon as={CaretDownIcon} size={20} color="contentSecondary" />
                    </Row>
                </Row>
                {renderDetails(selectedType)}
            </Column>
        </CardList.Item>
    );

    if (isLoading) {
        return trigger;
    }

    return (
        <Popover
            ref={popoverRef}
            data-testid="@modal/approve/limit-selector"
            placement={{ position: 'bottom', alignment: 'end' }}
            zIndex={zIndices.modal + 1}
            popoverOffset={-60}
            content={
                <Menu
                    content={
                        <CardList width={420}>
                            {renderOption('MINIMAL')}
                            {renderOption('INFINITE')}
                        </CardList>
                    }
                />
            }
        >
            {trigger}
        </Popover>
    );
};
