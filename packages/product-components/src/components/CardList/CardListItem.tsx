import { GhostContainer, type GhostContainerProps, Row } from '@trezor/components';

export type CardListItemProps = Omit<GhostContainerProps, 'borderRadius' | 'padding'>;

export const CardListItem = ({ children, ...rest }: CardListItemProps) => (
    <GhostContainer as="div" borderRadius={0} padding={{ vertical: 16, horizontal: 20 }} {...rest}>
        <Row justifyContent="space-between" gap={12} overflow="hidden">
            {children}
        </Row>
    </GhostContainer>
);
