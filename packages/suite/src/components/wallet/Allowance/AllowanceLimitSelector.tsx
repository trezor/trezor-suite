import { useRef } from 'react';

import { Translation, type TranslationKey } from '@suite/intl';
import { TokenIcon, TokenName, TokenSymbol } from '@suite/token';
import { toTokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AllowanceLimitType } from '@suite-common/wallet-types';
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
import { zIndices } from '@trezor/theme';

import type { AllowanceProvider } from './AllowanceProviderInfo';

type AllowanceLimitSelectorProps = {
    limitType: AllowanceLimitType;
    isLoading: boolean;
    networkSymbol: NetworkSymbol;
    onSelect: (limitType: AllowanceLimitType) => void;
    provider: AllowanceProvider;
    token: TokenInfo;
    displayAmount: AmountSubunit;
    hasPreapprovedAmount: boolean;
};

type ProviderKind = NonNullable<AllowanceProvider['kind']>;

const LIMIT_TYPE_LABEL_ID = {
    unlimited: 'TR_APPROVAL_VALUE_INFINITE',
    minimal: 'TR_APPROVAL_VALUE_MINIMAL',
} as const satisfies Record<AllowanceLimitType, TranslationKey>;

const LIMIT_TYPE_INFO_ID = {
    provider: {
        unlimited: 'TR_APPROVAL_VALUE_INFINITE_INFO',
        minimal: 'TR_APPROVAL_VALUE_MINIMAL_INFO',
    },
    vault: {
        unlimited: 'TR_EARN_YIELD_APPROVAL_VALUE_INFINITE_INFO',
        minimal: 'TR_EARN_YIELD_APPROVAL_VALUE_MINIMAL_INFO',
    },
} as const satisfies Record<ProviderKind, Record<AllowanceLimitType, TranslationKey>>;

const UNLIMITED_WARNING_ID = {
    provider: 'TR_APPROVAL_VALUE_INFINITE_WARNING',
    vault: 'TR_EARN_YIELD_APPROVAL_VALUE_INFINITE_WARNING',
} as const satisfies Record<ProviderKind, TranslationKey>;

const LIMIT_OPTION_TEST_ID = {
    minimal: '@modal/approve/minimal-option',
    unlimited: '@modal/approve/infinite-option',
} as const satisfies Record<AllowanceLimitType, string>;

export const AllowanceLimitSelector = ({
    limitType,
    isLoading,
    networkSymbol,
    onSelect,
    provider,
    token,
    displayAmount,
    hasPreapprovedAmount,
}: AllowanceLimitSelectorProps) => {
    const popoverRef = useRef<PopoverRef>(null);
    const tokenContract = toTokenAddress(token.contract);
    const symbolLabel = token.symbol ? (
        <TokenSymbol networkSymbol={networkSymbol} tokenContract={tokenContract} isTruncated />
    ) : (
        <TokenName networkSymbol={networkSymbol} tokenContract={tokenContract} />
    );

    const providerKind: ProviderKind = provider.kind ?? 'provider';

    const translationValues = {
        value: subunitsToUnits({ value: displayAmount, decimals: token.decimals }).toString(),
        send: symbolLabel,
        provider: provider.name,
    };

    const handleSelect = (nextLimitType: AllowanceLimitType) => {
        onSelect(nextLimitType);
        popoverRef.current?.close();
    };

    const renderDetails = (type: AllowanceLimitType) => (
        <>
            <Paragraph typographyStyle="body-sm" intent="neutral" priority="secondary">
                <Translation
                    id={LIMIT_TYPE_INFO_ID[providerKind][type]}
                    values={translationValues}
                />
            </Paragraph>
            {type === 'unlimited' && (
                <Text intent="warning" typographyStyle="body-sm">
                    <Row gap={8}>
                        <Icon as={WarningIcon} size={16} />
                        <Translation
                            id={UNLIMITED_WARNING_ID[providerKind]}
                            values={{ send: symbolLabel }}
                        />
                    </Row>
                </Text>
            )}
        </>
    );

    const renderOption = (type: AllowanceLimitType) => (
        <CardList.Item
            key={type}
            onClick={() => handleSelect(type)}
            width="100%"
            data-testid={LIMIT_OPTION_TEST_ID[type]}
        >
            <Column gap={4} flex="1" alignItems="flex-start">
                <Row gap={8}>
                    <TokenIcon symbol={networkSymbol} contractAddress={tokenContract} size={20} />
                    <Text typographyStyle="body-sm-strong">
                        <Translation id={LIMIT_TYPE_LABEL_ID[type]} values={translationValues} />
                    </Text>
                </Row>
                {renderDetails(type)}
            </Column>
        </CardList.Item>
    );

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
                            contractAddress={tokenContract}
                            size={20}
                        />
                        <Text
                            typographyStyle="body-sm-strong"
                            data-testid="@modal/approve/limit-value"
                        >
                            <Translation
                                id={LIMIT_TYPE_LABEL_ID[limitType]}
                                values={translationValues}
                            />
                        </Text>
                        <Icon as={CaretDownIcon} size={20} color="contentSecondary" />
                    </Row>
                </Row>
                {renderDetails(limitType)}
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
                            {renderOption('minimal')}
                            {renderOption('unlimited')}
                        </CardList>
                    }
                />
            }
        >
            {trigger}
        </Popover>
    );
};
