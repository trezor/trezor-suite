import styled from 'styled-components';

import {
    type FormCellProps,
    Icon,
    Input,
    type InputProps,
    Spinner,
    pickFormCellProps,
} from '@trezor/components';

const FakeSelectContainer = styled.button<{ $isDisabled?: boolean }>`
    border: unset;
    background: unset;
    box-shadow: unset;
    font-size: inherit;

    cursor: ${({ $isDisabled }) => ($isDisabled ? 'default' : 'pointer')};

    & input {
        cursor: ${({ $isDisabled }) => ($isDisabled ? 'default' : 'pointer')};
    }
`;

export type FakeSelectProps = Omit<FormCellProps, 'children'> &
    Pick<InputProps, 'value' | 'placeholder' | 'size'> & {
        isLoading?: boolean;
        onClick: () => void;
    };

export const FakeSelect = (props: FakeSelectProps) => {
    const {
        value,
        placeholder,
        isDisabled = false,
        isLoading = false,
        size = 'large',
        onClick,
        'data-testid': dataTestId,
        ...rest
    } = props;

    const formCellProps = pickFormCellProps(rest);
    const leftContent = isLoading ? <Spinner size={20} /> : undefined;

    return (
        <FakeSelectContainer type="button" onClick={onClick} disabled={isDisabled}>
            <Input
                {...formCellProps}
                value={value}
                placeholder={placeholder}
                size={size}
                leftContent={leftContent}
                disabled={isDisabled}
                rightContent={
                    <Icon name="caretDown" size={20} intent="neutral" priority="secondary" />
                }
                data-testid={dataTestId}
                readOnly
            />
        </FakeSelectContainer>
    );
};
