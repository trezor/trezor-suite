import type { ReactNode } from 'react';

import styled from 'styled-components';

import { Card, variables } from '@trezor/components';
import { spacings, spacingsPx } from '@trezor/theme';

export const SectionCard = ({ children }: { children: ReactNode }) => (
    <Card margin={{ bottom: spacings.xl }}>{children}</Card>
);

export const SdkHeading = styled.h2`
    display: flex;
    flex-flow: row wrap;
    align-items: center;
    gap: ${spacingsPx.sm};
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: ${spacingsPx.sm};
`;

export const HiddenNextraHeading = styled.div`
    /* hidden heading for Nextra sidebar */
    visibility: hidden;
    height: 1px;
`;

export const SdkName = styled.div``;

export const SdkTag = styled.div`
    opacity: 0.5;

    @media (min-width: ${variables.SCREEN_SIZE.LG}) {
        flex: 1;
    }
`;

export const SdkContainer = styled.div`
    display: grid;
    grid-template-columns: 1fr;
    margin-top: ${spacingsPx.xxl};
    gap: ${spacingsPx.xxl};

    @media (min-width: ${variables.SCREEN_SIZE.LG}) {
        grid-template-columns: 2fr 1fr;
    }
`;

export const SdkDescription = styled.div``;

export const ExamplesAside = styled.div`
    p {
        margin-top: ${spacingsPx.xs};
    }

    ul {
        list-style-type: none;
        padding: 0;
        margin: 0;
    }
`;

export const ExampleHeading = styled.h3`
    font-size: 1rem;
    text-transform: uppercase;
    font-weight: 600;
    margin-bottom: 0;
`;
