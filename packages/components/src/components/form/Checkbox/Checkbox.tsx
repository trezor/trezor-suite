import {
    type EventHandler,
    type MouseEventHandler,
    type ReactNode,
    type SyntheticEvent,
} from 'react';

import styled, { css } from 'styled-components';

import { borders } from '@trezor/theme';

import { type LabelAlignment, type VerticalAlignment } from './types';
import {
    type FrameProps,
    type FramePropsKeys,
    pickAndPrepareFrameProps,
} from '../../../utils/frameProps';
import { Row } from '../../Flex/Flex';
import { Icon } from '../../Icon/Icon';
import { Text } from '../../typography/Text/Text';
import { commonCheckInputStyles } from '../utils';

export const allowedCheckboxFrameProps = ['margin'] as const satisfies FramePropsKeys[];
export type AllowedCheckboxFrameProps = Pick<
    FrameProps,
    (typeof allowedCheckboxFrameProps)[number]
>;

const HiddenInput = styled.input`
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
`;

const FakeInput = styled.div`
    ${commonCheckInputStyles}

    border-radius: ${borders.radii.xxs};

    ${({ theme }) => css`
        input:checked + & {
            background-color: ${theme.legacyBackgroundPrimaryDefault};
        }

        input:not(:checked) + & > * {
            opacity: 0;
        }

        input:checked:disabled + & {
            border-color: ${theme.legacyBackgroundPrimarySubtleOnElevation0};
            background-color: ${theme.legacyBackgroundPrimarySubtleOnElevation0};
        }
    `}
`;

export type CheckboxProps = AllowedCheckboxFrameProps & {
    isChecked?: boolean;
    isDisabled?: boolean;
    labelAlignment?: LabelAlignment;
    verticalAlignment?: VerticalAlignment;
    onChange: EventHandler<SyntheticEvent>;
    onClick?: MouseEventHandler<HTMLLabelElement>;
    'data-testid'?: string;
    children?: ReactNode;
};

export const Checkbox = ({
    isChecked,
    isDisabled = false,
    labelAlignment = 'end',
    verticalAlignment = 'start',
    onChange,
    onClick,
    'data-testid': dataTest,
    children,
    ...rest
}: CheckboxProps) => {
    const frameProps = pickAndPrepareFrameProps(rest, allowedCheckboxFrameProps, false);

    return (
        <Row
            gap={12}
            alignItems={verticalAlignment === 'start' ? 'flex-start' : 'center'}
            data-testid={dataTest}
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
                type="checkbox"
                tabIndex={0}
            />

            <FakeInput>
                <Icon size={16} color="contentPrimaryInverse" name="check" />
            </FakeInput>

            {children && (
                <Text typographyStyle="body-md" flex="1" isDisabled={isDisabled} as="div">
                    {children}
                </Text>
            )}
        </Row>
    );
};
