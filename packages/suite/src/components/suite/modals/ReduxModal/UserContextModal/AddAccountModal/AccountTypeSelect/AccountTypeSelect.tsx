import styled from 'styled-components';
import { Column, Select } from '@trezor/components';
import { Translation } from 'src/components/suite/Translation';
import { getAccountTypeName, getAccountTypeTech } from '@suite-common/wallet-utils';
import { AccountTypeDescription } from './AccountTypeDescription';
import { NetworkAccount, NetworkSymbol, NetworkType } from '@suite-common/wallet-config';
import { spacings, typography } from '@trezor/theme';

const LabelWrapper = styled.div`
    display: flex;
    align-items: baseline;
`;

const TypeInfo = styled.div`
    display: flex;
    flex: 1;
    margin-left: 1ch;
    color: ${({ theme }) => theme.textSubdued};
    ${typography.label}
`;

interface AccountTypeSelectProps {
    accountTypes: NetworkAccount[];
    networkType: NetworkType;
    symbol: NetworkSymbol;
    onSelectAccountType: (account: NetworkAccount) => void;
    selectedAccountType?: NetworkAccount;
}

export const AccountTypeSelect = ({
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
            <LabelWrapper>
                {accountTypeName && <Translation id={accountTypeName} />}
                <TypeInfo>
                    <Translation id={getAccountTypeTech(option.value.bip43Path)} />
                </TypeInfo>
            </LabelWrapper>
        );
    };

    const options = accountTypes.map(buildAccountTypeOption);
    // the default, 'normal' account type is expected to be the first one
    const defaultAccountType = accountTypes[0];

    const bip43PathToDescribe = selectedAccountType?.bip43Path ?? defaultAccountType.bip43Path;

    return (
        <Column gap={spacings.md}>
            <Select
                data-testid="@add-account-type/select"
                label={<Translation id="TR_ACCOUNT_TYPE" />}
                isSearchable={false}
                isClearable={false}
                value={buildAccountTypeOption(selectedAccountType ?? defaultAccountType)}
                options={options}
                formatOptionLabel={formatLabel}
                onChange={(option: Option) => onSelectAccountType(option.value)}
            />
            <AccountTypeDescription
                bip43Path={bip43PathToDescribe}
                accountType={selectedAccountType?.accountType || 'normal'}
                networkType={networkType}
                symbol={symbol}
            />
        </Column>
    );
};
