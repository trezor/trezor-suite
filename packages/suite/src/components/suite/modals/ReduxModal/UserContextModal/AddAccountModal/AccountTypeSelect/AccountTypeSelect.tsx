import styled from 'styled-components';
import { Select } from '@trezor/components';
import { Translation } from 'src/components/suite/Translation';
import { getAccountTypeName, getAccountTypeTech } from '@suite-common/wallet-utils';
import { AccountTypeDescription } from './AccountTypeDescription';
import { Network } from 'src/types/wallet';
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

const buildAccountTypeOption = (network: Network) =>
    ({
        value: network,
        label: network.accountType || 'normal',
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
    network: Network;
    accountTypes: Network[];
    onSelectAccountType: (network: Network) => void;
}

export const AccountTypeSelect = ({
    network,
    accountTypes,
    onSelectAccountType,
}: AccountTypeSelectProps) => {
    const options = accountTypes.map(buildAccountTypeOption);

    return (
        <>
            <Select
                data-test-id="@add-account-type/select"
                label={<Translation id="TR_ACCOUNT_TYPE" />}
                isSearchable={false}
                isClearable={false}
                value={buildAccountTypeOption(network || accountTypes[0])}
                options={options}
                formatOptionLabel={formatLabel}
                onChange={(option: Option) => onSelectAccountType(option.value)}
            />
            <AccountTypeDescription
                bip43Path={network.bip43Path}
                hasMultipleAccountTypes={accountTypes && accountTypes?.length > 1}
            />
        </>
    );
};
