import {
    type EventHandler,
    type MouseEventHandler,
    type ReactNode,
    type SyntheticEvent,
} from 'react';

import styled, { css } from 'styled-components';

import { borders } from '@trezor/theme';

import { pickAndPrepareFrameProps } from '../../../utils/frameProps';
import { Row } from '../../Flex/Flex';
import { Text } from '../../typography/Text/Text';
import { type AllowedCheckboxFrameProps, allowedCheckboxFrameProps } from '../Checkbox/Checkbox';
import { type LabelAlignment, type VerticalAlignment } from '../Checkbox/types';
import { commonCheckInputStyles } from '../utils';

const HiddenInput = styled.input`
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
`;

const FakeInput = styled.div`
    ${commonCheckInputStyles}

    border-radius: ${borders.radii.full};

    &::after {
        content: '';
        width: 12px;
        height: 12px;
        border-radius: 50%;
        opacity: 0;
        transition: 0.2s ease-in-out;
        transform: scale(0);
    }

    ${({ theme }) => css`
        input:checked + & {
            border-color: transparent;

            &::after {
                opacity: 1;
                transform: scale(1);
            }
        }

        input:checked:not(:disabled) + &::after {
            background-color: ${theme.contentPrimaryInverse};
        }

        input:checked:disabled + & {
            background-color: ${theme.elementFillBoldDisabled};

            &::after {
                background-color: ${theme.contentDisabled};
            }
        }
    `}
`;

export type RadioProps = AllowedCheckboxFrameProps & {
    isChecked?: boolean;
    isDisabled?: boolean;
    labelAlignment?: LabelAlignment;
    verticalAlignment?: VerticalAlignment;
    onChange: EventHandler<SyntheticEvent>;
    onClick?: MouseEventHandler<HTMLLabelElement>;
    'data-testid'?: string;
    children?: ReactNode;
};

export const Radio = ({
    isChecked,
    labelAlignment = 'end',
    verticalAlignment = 'start',
    isDisabled = false,
    onChange,
    onClick,
    'data-testid': dataTest,
    children,
    ...rest
}: RadioProps) => {
    const frameProps = pickAndPrepareFrameProps(rest, allowedCheckboxFrameProps, false);

    return (
        <Row
            gap={12}
            alignItems={verticalAlignment === 'start' ? 'flex-start' : 'center'}
            data-testid={dataTest}
            data-checked={isChecked}
            isReversed={labelAlignment === 'start'}
            cursor={isDisabled ? 'not-allowed' : 'pointer'}
            as="label"
            onClick={onClick}
            {...frameProps}
        >
            <HiddenInput
                checked={isChecked}
                disabled={isDisabled}
                onChange={onChange}
                type="radio"
                tabIndex={0}
            />

            <FakeInput />

            {children && (
                <Text typographyStyle="body-md" flex="1" isDisabled={isDisabled} as="div">
                    {children}
                </Text>
            )}
        </Row>
    );
};
