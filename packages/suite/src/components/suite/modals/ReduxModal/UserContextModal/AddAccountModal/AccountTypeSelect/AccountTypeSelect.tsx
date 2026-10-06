import { memo } from 'react';

import { Translation } from '@suite/intl';
import {
    type NetworkAccount,
    type NetworkSymbol,
    type NetworkType,
} from '@suite-common/wallet-config';
import { getAccountTypeName, getAccountTypeTech } from '@suite-common/wallet-utils';
import { Column, Paragraph, Row, Select, Text } from '@trezor/components';

import { AccountTypeDescription } from './AccountTypeDescription';

type AccountTypeSelectProps = {
    accountTypes: NetworkAccount[];
    networkType: NetworkType;
    symbol: NetworkSymbol;
    onSelectAccountType: (account: NetworkAccount) => void;
    selectedAccountType?: NetworkAccount;
};

const AccountTypeSelectComponent = ({
    selectedAccountType,
    accountTypes,
    networkType,
    symbol,
    onSelectAccountType,
}: AccountTypeSelectProps) => {
    const buildAccountTypeOption = (account: NetworkAccount) =>
        ({
            value: account,
            label: account.accountType,
        }) as const;
    type Option = ReturnType<typeof buildAccountTypeOption>;

    const formatLabel = (option: Option) => {
        const accountTypeName = getAccountTypeName({
            path: option.value.bip43Path,
            accountType: option.value.accountType,
            networkType,
        });

        return (
            <Row alignItems="baseline" gap={8}>
                {accountTypeName && <Translation id={accountTypeName} />}
                <Text intent="neutral" priority="secondary">
                    <Translation id={getAccountTypeTech(option.value.bip43Path)} />
                </Text>
            </Row>
        );
    };

    const options = accountTypes.map(buildAccountTypeOption);
    // the default, 'normal' account type is expected to be the first one
    const defaultAccountType = accountTypes[0];

    if (!defaultAccountType) return null;

    const value = buildAccountTypeOption(selectedAccountType ?? defaultAccountType);

    const bip43PathToDescribe = selectedAccountType?.bip43Path ?? defaultAccountType.bip43Path;

    return (
        <Column alignItems="center" gap={16}>
            <Select
                data-testid="@add-account-type/select"
                labelLeft={
                    <Text typographyStyle="body-sm">
                        <Translation id="TR_SELECT_ADDRESS_TYPE" />
                    </Text>
                }
                isSearchable={false}
                isClearable={false}
                value={value}
                options={options}
                formatOptionLabel={formatLabel}
                onChange={(option: Option) => onSelectAccountType(option.value)}
                openMenuOnFocus={false}
            />
            <Paragraph intent="neutral" priority="secondary" typographyStyle="body-sm">
                <AccountTypeDescription
                    bip43Path={bip43PathToDescribe}
                    accountType={selectedAccountType?.accountType || 'normal'}
                    networkType={networkType}
                    symbol={symbol}
                />
            </Paragraph>
        </Column>
    );
};

export const AccountTypeSelect = memo(AccountTypeSelectComponent);
