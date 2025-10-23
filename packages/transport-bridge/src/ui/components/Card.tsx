import { type CardProps, Card as ComponentsCard } from '@trezor/components';

export const Card = (props: CardProps) => (
    <ComponentsCard margin={{ top: 8, bottom: 8 }} {...props} />
);
