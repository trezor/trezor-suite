import { ReactSVG } from 'react-svg';

import styled from 'styled-components';

// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import {
    type IllustrationName,
    illustrations,
} from '@suite-common/illustrations/src/illustrations';

import { type IllustrationIntent } from './types';
import { mapIntentToBorderColor, mapIntentToFillColor } from './utils';
import {
    type FrameProps,
    type FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../utils/frameProps';
import { type TransientProps } from '../../utils/transientProps';

export const allowedIllustrationFrameProps = [
    'margin',
    'width',
] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedIllustrationFrameProps)[number]>;

type ContainerProps = {
    $intent: IllustrationIntent;
} & TransientProps<AllowedFrameProps>;

const Container = styled.div<ContainerProps>`
    flex-shrink: 0;

    .illustration-border {
        fill: ${({ $intent, theme }) => theme[mapIntentToBorderColor($intent)]};
        transition: fill 0.3s;
    }

    .illustration-fill {
        fill: ${({ $intent, theme }) => theme[mapIntentToFillColor($intent)]};
        transition: fill 0.3s;
    }

    ${withFrameProps}
`;

const SVG = styled(ReactSVG)`
    width: 100%;
    display: flex;

    div {
        width: 100%;
        display: flex;
    }

    svg {
        width: 100%;
        height: auto;
    }
` as typeof ReactSVG;

export type IllustrationProps = AllowedFrameProps & {
    name: IllustrationName;
    intent?: IllustrationIntent;
    'data-testid'?: string;
};

export const Illustration = ({
    name,
    intent = 'brand',
    'data-testid': dataTest,
    ...rest
}: IllustrationProps) => {
    const frameProps = pickAndPrepareFrameProps(rest, allowedIllustrationFrameProps);

    return (
        <Container $intent={intent} data-testid={dataTest} {...frameProps}>
            <SVG src={illustrations[name]} />
        </Container>
    );
};

export type { IllustrationName };
