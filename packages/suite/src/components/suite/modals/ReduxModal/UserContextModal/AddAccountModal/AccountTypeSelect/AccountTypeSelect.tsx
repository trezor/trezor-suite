import styled from 'styled-components';
import { Select } from '@trezor/components';
import { Translation } from 'src/components/suite/Translation';
import { getAccountTypeName, getAccountTypeTech } from '@suite-common/wallet-utils';
import { AccountTypeDescription } from './AccountTypeDescription';
import { NetworkAccountCollection } from '@suite-common/wallet-config';
import { typography } from '@trezor/theme';

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

const buildAccountTypeOption = (account: NetworkAccountCollection[number]) =>
    ({
        value: account,
        label: account.accountType,
    }) as const;
type Option = ReturnType<typeof buildAccountTypeOption>;

const formatLabel = (option: Option) => (
    <LabelWrapper>
        <Translation id={getAccountTypeName(option.value.bip43Path)} />

        <TypeInfo>
            <Translation id={getAccountTypeTech(option.value.bip43Path)} />
        </TypeInfo>
    </LabelWrapper>
);

interface AccountTypeSelectProps {
    accountTypes: NetworkAccountCollection;
    onSelectAccountType: (account: NetworkAccountCollection[number]) => void;
    selectedAccountType?: NetworkAccountCollection[number];
}

export const AccountTypeSelect = ({
    selectedAccountType,
    accountTypes,
    onSelectAccountType,
}: AccountTypeSelectProps) => {
    const options = accountTypes.map(buildAccountTypeOption);
    // the default, 'normal' account type is expected to be the first one
    const defaultAccountType = accountTypes[0];

    const bip43PathToDescribe = selectedAccountType?.bip43Path ?? defaultAccountType.bip43Path;

    return (
        <>
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
                hasMultipleAccountTypes={accountTypes && accountTypes?.length > 1}
            />
        </>
    );
};
