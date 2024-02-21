import { components } from 'react-select';
import styled from 'styled-components';
import { Select, SelectProps } from '@trezor/components';
import type { Account } from 'src/types/wallet';
import type { State as RevealedAddresses } from 'src/reducers/wallet/receiveReducer';
import {
    useSignAddressOptions,
    AddressItem,
} from 'src/hooks/wallet/sign-verify/useSignAddressOptions';
import { HiddenAddressRow } from './HiddenAddressRow';
import { VerifyAddressButton } from './VerifyAddressButton';

const HiddenAddressSingleValue = styled(HiddenAddressRow)`
    margin-left: 6px;
`;

const HiddenCaretInput = styled(components.Input)<{ $hideCaret: boolean }>`
    caret-color: ${({ $hideCaret }) => ($hideCaret ? 'transparent' : 'unset')};
`;

const Option = ({ data, value, isFocused, innerProps, ...rest }: any) => (
    <components.Option
        data={data}
        value={value}
        isFocused={isFocused}
        innerProps={{
            ...innerProps,
            'data-test-id': `@sign-verify/sign-address/option/${value}`,
        }}
        {...rest}
    >
        {data && <HiddenAddressRow item={data} isElevated={isFocused} />}
    </components.Option>
);

const Input = ({ selectProps, ...rest }: any) => (
    <>
        <HiddenCaretInput $hideCaret={!!selectProps.value} selectProps={selectProps} {...rest} />
        {selectProps?.value && <VerifyAddressButton item={selectProps.value} />}
    </>
);

const SingleValue = ({ data }: any) => <HiddenAddressSingleValue item={data} />;

const optionToAddress = (option: AddressItem | null) =>
    option
        ? {
              address: option.label,
              path: option.value,
          }
        : null;

type SignAddressInputProps = {
    account?: Account;
    revealedAddresses: RevealedAddresses;
} & Omit<SelectProps, 'useKeyPressScroll'>;

export const SignAddressInput = ({
    account,
    revealedAddresses,
    value,
    onChange,
    ...selectProps
}: SignAddressInputProps) => {
    const { getValue, groupedOptions } = useSignAddressOptions(account, revealedAddresses);

    const handleChange = (addr: AddressItem | null) => onChange?.(optionToAddress(addr));

    return (
        <Select
            value={getValue(value)}
            options={groupedOptions}
            onChange={handleChange}
            isSearchable
            placeholder=""
            components={{
                Option,
                Input,
                SingleValue,
            }}
            {...selectProps}
        />
    );
};
