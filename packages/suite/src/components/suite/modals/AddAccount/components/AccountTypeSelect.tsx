import React from 'react';
import styled from 'styled-components';
import { Select, variables } from '@trezor/components';
import { Translation } from '@suite-components/Translation';
import { Network } from '@wallet-types';
import { getAccountTypeIntl, getBip43Intl } from '@wallet-utils/accountUtils';
import { AccountTypeDescription } from './AccountTypeDescription';

const LabelWrapper = styled.div`
    display: flex;
    align-items: center;
`;

const TypeInfo = styled.div`
    display: flex;
    flex: 1;
    padding-top: 2px;
    align-items: center;
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    margin-left: 1ch;
`;

const buildAccountTypeOption = (network: Network) =>
    ({
        value: network,
        label: network.name,
    } as const);

type Option = ReturnType<typeof buildAccountTypeOption>;

const formatLabel = (option: Option) => (
    <LabelWrapper>
        <Translation id={getAccountTypeIntl(option.value.bip44)} />
        <TypeInfo>
            <Translation id={getBip43Intl(option.value.bip44)} />
        </TypeInfo>
    </LabelWrapper>
);

interface Props {
    network: Network;
    accountTypes: Network[];
    onSelectAccountType: (network: Network) => void;
}

export const AccountTypeSelect = ({ network, accountTypes, onSelectAccountType }: Props) => {
    const options = accountTypes.map(buildAccountTypeOption);
    return (
        <>
            <Select
                label={<Translation id="TR_ACCOUNT_TYPE" />}
                isSearchable={false}
                isClearable={false}
                value={buildAccountTypeOption(network || accountTypes[0])}
                options={options}
                formatOptionLabel={formatLabel}
                onChange={(option: Option) => onSelectAccountType(option.value)}
            />
            <AccountTypeDescription network={network} accountTypes={accountTypes} />
        </>
    );
};
