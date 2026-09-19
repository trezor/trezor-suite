import styled from 'styled-components';

import { SpinnerRing } from './SpinnerRing';
import { SpinnerSettledIcon } from './SpinnerSettledIcon';
import { useSpinnerStage } from './hooks/useSpinnerStage';
import type { SpinnerSize, SpinnerVariant } from './types';
import {
    type FrameProps,
    type FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../../utils/frameProps';
import { type TransientProps } from '../../../utils/transientProps';

export const allowedSpinnerFrameProps = ['margin', 'opacity'] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedSpinnerFrameProps)[number]>;

const Wrapper = styled.div<
    {
        $size: SpinnerSize;
        $isDisabled: boolean;
    } & TransientProps<AllowedFrameProps>
>`
    position: relative;
    display: flex;
    width: ${({ $size }) => $size}px;
    height: ${({ $size }) => $size}px;

    /* The ring paints itself with currentColor, so the whole artwork recolors from here. */
    color: ${({ theme, $isDisabled }) =>
        $isDisabled ? theme.contentDisabled : theme.contentBrand};

    ${withFrameProps}
`;

export type SpinnerProps = AllowedFrameProps & {
    size?: SpinnerSize;
    isDisabled?: boolean;
    variant?: SpinnerVariant;
    hasStartAnimation?: boolean;
    'data-testid'?: string;
};

export { spinnerSizes, spinnerVariants } from './types';
export type { SpinnerSize, SpinnerVariant } from './types';

export const Spinner = ({
    size = 40,
    isDisabled = false,
    variant = 'loading',
    hasStartAnimation,
    'data-testid': dataTest,
    ...rest
}: SpinnerProps) => {
    const { stage, handleIntroEnd, handleRotationEnd } = useSpinnerStage({
        variant,
        hasStartAnimation,
    });

    const frameProps = pickAndPrepareFrameProps(rest, allowedSpinnerFrameProps);

    return (
        <Wrapper
            $size={size}
            $isDisabled={isDisabled}
            data-component="Spinner"
            data-testid={dataTest ?? '@spinner'}
            {...frameProps}
        >
            <SpinnerRing
                stage={stage}
                onIntroEnd={handleIntroEnd}
                onRotationEnd={handleRotationEnd}
            />

            {stage === 'settled' && variant !== 'loading' && (
                <SpinnerSettledIcon variant={variant} isDisabled={isDisabled} />
            )}
        </Wrapper>
    );
};
