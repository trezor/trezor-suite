import { Rows } from '@trezor/components';
import { spacings } from '@trezor/theme';
import styled from 'styled-components';

export const Body = styled(Rows).attrs(() => ({ gap: spacings.lg, alignItems: 'start' }))``;

export const Section = styled(Rows).attrs(() => ({ gap: spacings.xs, alignItems: 'start' }))`
    width: 100%;
`;
