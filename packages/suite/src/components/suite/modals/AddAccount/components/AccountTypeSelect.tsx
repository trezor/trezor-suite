import React from 'react';
import styled from 'styled-components';
import { colors, Select, variables } from '@trezor/components-v2';
import { Translation } from '@suite-components/Translation';
import { ExternalNetwork, Network } from '@wallet-types';
import { getAccountTypeIntl } from '@wallet-utils/accountUtils';

const LabelWrapper = styled.div`
    display: flex;
    align-items: center;
`;

const TypeInfo = styled.div`
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${colors.BLACK50};
    margin-left: 1ch;
`;

const buildAccountTypeOption = (t: Network) => {
    const label = getAccountTypeIntl(t.accountType || 'normal');

    return {
        value: t.symbol,
        label,
        network: t,
    };
};

interface Props {
    selectedNetwork?: Network | ExternalNetwork;
    accountTypes: Network[];
    onSelectAccountType: (accountType: Network['accountType']) => void;
}
type Option = ReturnType<typeof buildAccountTypeOption>;

const formatLabel = (option: Option) => {
    return (
        <LabelWrapper>
            <Translation {...option.label} />
            {option.network.symbol === 'btc' &&
                (option.network.accountType ?? 'normal') === 'normal' && (
                    <TypeInfo>Bech32</TypeInfo>
                )}
        </LabelWrapper>
    );
};

const AccountTypeSelect = (props: Props) => {
    if (!props.selectedNetwork || props.selectedNetwork.networkType === 'external') return null;

    const options = props.accountTypes.map(t => buildAccountTypeOption(t));

    return (
        <Select
            placeholder="Select network..."
            isSearchable={false}
            isClearable={false}
            width={250}
            value={
                props.selectedNetwork ? buildAccountTypeOption(props.selectedNetwork) : options?.[0]
            }
            options={options}
            formatOptionLabel={formatLabel}
            onChange={(option: Option) =>
                props.onSelectAccountType(option.network.accountType ?? 'normal')
            }
        />
    );
};

export default AccountTypeSelect;
