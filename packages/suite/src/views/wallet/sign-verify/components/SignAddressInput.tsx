import React, { useEffect, FocusEventHandler } from 'react';
import { components } from 'react-select';
import styled from 'styled-components';
import { Select } from '@trezor/components';
import type { Account } from '@wallet-types';
import type { State as RevealedAddresses } from '@wallet-reducers/receiveReducer';
import {
    useSignAddressOptions,
    AddressItem,
} from '@wallet-hooks/sign-verify/useSignAddressOptions';
import HiddenAddressRow from './HiddenAddressRow';
import VerifyAddressButton from './VerifyAddressButton';

const HiddenAddressSingleValue = styled(HiddenAddressRow)`
    margin-left: 6px;
`;

const HiddenCaretInput = styled(components.Input)<{ $hideCaret: boolean }>`
    caret-color: ${({ $hideCaret }) => ($hideCaret ? 'transparent' : 'unset')};
`;

const Option = ({ data, isFocused, ...rest }: any) => (
    <components.Option data={data} isFocused={isFocused} {...rest}>
        <HiddenAddressRow item={data} variant={isFocused ? 'option-focused' : 'option'} />
    </components.Option>
);

const Input = ({ selectProps, ...rest }: any) => (
    <>
        <HiddenCaretInput $hideCaret={!!selectProps.value} selectProps={selectProps} {...rest} />
        {selectProps?.value && <VerifyAddressButton item={selectProps.value} />}
    </>
);

const SingleValue = ({ data }: any) => <HiddenAddressSingleValue item={data} variant="input" />;

const optionToAddress = (option: AddressItem | null) =>
    option
        ? {
              address: option.label,
              path: option.value,
          }
        : null;

const SignAddressInput = ({
    name,
    label,
    error,
    account,
    revealedAddresses,
    value,
    onChange,
    onBlur,
}: {
    name: string;
    label?: string | React.ReactElement;
    error?: string | React.ReactElement;
    account?: Account;
    revealedAddresses: RevealedAddresses;
    value: string;
    onChange: (addr: { path: string; address: string } | null) => void;
    onBlur?: FocusEventHandler;
}) => {
    const { getValue, groupedOptions, onlyValue } = useSignAddressOptions(
        account,
        revealedAddresses,
    );

    useEffect(() => {
        if (!onlyValue || value) return;
        onChange(optionToAddress(onlyValue));
    }, [onChange, onlyValue, value]);

    return (
        <Select
            name={name}
            label={label}
            value={getValue(value)}
            options={groupedOptions}
            onChange={(addr: AddressItem | null) => onChange(optionToAddress(addr))}
            onBlur={onBlur}
            noError={false}
            bottomText={error || null}
            state={error ? 'error' : undefined}
            isSearchable
            isDisabled={!!onlyValue}
            components={{
                Option,
                Input,
                SingleValue,
            }}
        />
    );
};

export default SignAddressInput;
