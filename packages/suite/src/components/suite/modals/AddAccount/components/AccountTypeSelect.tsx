import React from 'react';
import styled from 'styled-components';
import { colors, Select, variables } from '@trezor/components';
import { Translation } from '@suite-components/Translation';
import { Network } from '@wallet-types';
import { getAccountTypeIntl, getBip43Intl } from '@wallet-utils/accountUtils';

const LabelWrapper = styled.div`
    display: flex;
    align-items: center;
`;

const TypeInfo = styled.div`
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${colors.BLACK50};
    margin-left: 1ch;
`;

const buildAccountTypeOption = (network: Network) => ({
    value: network,
    label: getAccountTypeIntl(network.accountType),
});

interface Props {
    network?: Network;
    accountTypes: Network[];
    onSelectAccountType: (network: Network) => void;
}
type Option = ReturnType<typeof buildAccountTypeOption>;

const formatLabel = (option: Option) => (
    <LabelWrapper>
        <Translation {...option.label} />
        <TypeInfo>
            <Translation {...getBip43Intl(option.value.bip44)} />
        </TypeInfo>
    </LabelWrapper>
);

export default (props: Props) => {
    const options = props.accountTypes.map(t => buildAccountTypeOption(t));
    return (
        <Select
            isSearchable={false}
            isClearable={false}
            width={250}
            value={buildAccountTypeOption(props.network || props.accountTypes[0])}
            options={options}
            formatOptionLabel={formatLabel}
            onChange={(option: Option) => props.onSelectAccountType(option.value)}
        />
    );
};
