import { ReactNode, useState } from 'react';

import styled from 'styled-components';

import { spacings } from '@trezor/theme';

import {
    FrameProps,
    FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../../utils/frameProps';
import { Column } from '../../Flex/Flex';
import { InputState } from '../inputTypes';
import { TopAddons } from '../TopAddons';
import { BottomText } from '../BottomText';
import { IconName } from '../../Icon/Icon';
import { TransientProps } from '../../../utils/transientProps';

export const allowedFormCellFrameProps = [
    'margin',
    'width',
    'maxWidth',
] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedFormCellFrameProps)[number]>;

const formCellProps = [
    'labelHoverRight',
    'labelLeft',
    'labelRight',
    'bottomText',
    'bottomTextIconComponent',
    'inputState',
    'isDisabled',
    'className',
    ...allowedFormCellFrameProps,
] as const satisfies (keyof FormCellProps)[];

export const pickFormCellProps = (props: Record<string, any>): Partial<FormCellProps> =>
    formCellProps.reduce(
        (acc: Partial<FormCellProps>, prop: string) => ({ ...acc, [prop]: props[prop] }),
        {},
    );

const Wrapper = styled.div<TransientProps<AllowedFrameProps>>`
    width: 100%;

    ${withFrameProps}
`;

export type FormCellProps = AllowedFrameProps & {
    labelHoverRight?: React.ReactNode;
    labelLeft?: React.ReactNode;
    labelRight?: React.ReactNode;
    bottomText?: ReactNode;
    bottomTextIconComponent?: ReactNode;
    bottomTextIconName?: IconName;
    inputState?: InputState;
    isDisabled?: boolean;
    children: ReactNode;
    className?: string;
};

export const FormCell = ({
    children,
    labelLeft,
    labelRight,
    labelHoverRight,
    bottomText,
    bottomTextIconComponent,
    bottomTextIconName,
    inputState,
    isDisabled,
    className,
    ...rest
}: FormCellProps) => {
    const [isHovered, setIsHovered] = useState(false);
    const frameProps = pickAndPrepareFrameProps(rest, allowedFormCellFrameProps);

    return (
        <Wrapper
            {...frameProps}
            className={className}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <Column alignItems="stretch" gap={spacings.xs}>
                <TopAddons
                    isHovered={isHovered}
                    addonLeft={labelLeft}
                    hoverAddonRight={labelHoverRight}
                    addonRight={labelRight}
                />
                {children}
                {bottomText && (
                    <BottomText
                        inputState={inputState}
                        isDisabled={isDisabled}
                        iconComponent={bottomTextIconComponent}
                        iconName={bottomTextIconName}
                    >
                        {bottomText}
                    </BottomText>
                )}
            </Column>
        </Wrapper>
    );
};
