import styled from 'styled-components';
import { Button, H3, Box, Divider, BoxProps } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { ReactNode } from 'react';
import { borders } from '@trezor/theme';

const Heading = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
`;

const StyledBox = styled(Box)`
    flex-direction: column;
    align-items: flex-start;
    border-left-width: 10px;
    border-radius: ${borders.radii.lg};
`;

interface Props {
    onClose: () => void;
    variant: BoxProps['variant'];
    title: ReactNode;
    children: React.ReactNode;
}

export const CloseableBanner = ({ onClose, variant, title, children }: Props) => (
    <StyledBox variant={variant}>
        <Heading>
            <H3>{title}</H3>
            <Button variant="tertiary" onClick={onClose}>
                <Translation id="TR_GOT_IT" />
            </Button>
        </Heading>
        <Divider />
        {children}
    </StyledBox>
);
