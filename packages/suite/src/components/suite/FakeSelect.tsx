import styled from 'styled-components';

import {
    FormCellProps,
    Icon,
    Input,
    InputProps,
    Spinner,
    pickFormCellProps,
} from '@trezor/components';

const FakeSelectContainer = styled.button`
    border: unset;
    background: unset;
    box-shadow: unset;
    font-size: inherit;

    cursor: pointer;

    & input {
        cursor: pointer;
    }
`;

export type FakeSelectProps = Omit<FormCellProps, 'children'> &
    Pick<InputProps, 'value' | 'placeholder' | 'size' | 'leftContent'> & {
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
        leftContent,
        ...rest
    } = props;

    const formCellProps = pickFormCellProps(rest);

    const leftContentComponent = leftContent ?? (isLoading ? <Spinner size={20} /> : undefined);

    return (
        <FakeSelectContainer type="button" onClick={onClick} disabled={isDisabled}>
            <Input
                {...formCellProps}
                value={value}
                placeholder={placeholder}
                size={size}
                leftContent={leftContentComponent}
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
