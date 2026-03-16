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

    position: relative;
    border-radius: ${borders.radii.full};

    &::after {
        content: '';
        width: 14px;
        height: 14px;
        border-radius: 50%;
        opacity: 0;
        transition: 0.1s ease-in-out;
    }

    ${({ theme }) => css`
        &::after {
            background-color: ${theme.backgroundPrimaryDefault};
        }

        input:checked + & {
            background-color: ${theme.backgroundSurfaceElevation0};

            &::after {
                opacity: 1;
            }
        }

        input:disabled:not(:checked) + &::after {
            background-color: transparent;
        }

        input:checked:disabled + & {
            border-color: ${theme.backgroundPrimarySubtleOnElevation1};
            background-color: transparent;

            &::after {
                background-color: ${theme.backgroundPrimarySubtleOnElevation0};
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
