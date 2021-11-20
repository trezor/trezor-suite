import React from 'react';
import styled from 'styled-components';
import { P, Select, variables } from '@trezor/components';
import { Translation } from '@suite-components/Translation';
import { getAccountTypeName, getAccountTypeTech } from '@wallet-utils/accountUtils';
import { AccountTypeDescription } from './AccountTypeDescription';
import type { UnavailableCapabilities } from 'trezor-connect';
import type { Network } from '@wallet-types';

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

const UnavailableInfo = styled(P)`
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    margin: 20px 0;
`;

const buildAccountTypeOption = (network: Network) =>
    ({
        value: network,
        label: network.name,
    } as const);

type Option = ReturnType<typeof buildAccountTypeOption>;

const formatLabel = (option: Option) => (
    <LabelWrapper>
        <Translation id={getAccountTypeName(option.value.bip43Path)} />
        <TypeInfo>
            <Translation id={getAccountTypeTech(option.value.bip43Path)} />
        </TypeInfo>
    </LabelWrapper>
);

interface Props {
    network: Network;
    accountTypes: Network[];
    onSelectAccountType: (network: Network) => void;
    unavailableCapabilities?: UnavailableCapabilities;
}

export const AccountTypeSelect = ({
    network,
    accountTypes,
    onSelectAccountType,
    unavailableCapabilities,
}: Props) => {
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
            {unavailableCapabilities && unavailableCapabilities[network.accountType!] ? (
                <UnavailableInfo size="small" textAlign="left">
                    <Translation id="TR_ACCOUNT_TYPE_BIP86_NOT_SUPPORTED" />
                </UnavailableInfo>
            ) : (
                <AccountTypeDescription network={network} accountTypes={accountTypes} />
            )}
        </>
    );
};
