import { variables } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';

export const CoinmarketWrapper = `
    gap: ${spacingsPx.md};
    display: grid;
    grid-template-columns: minmax(500px, auto) minmax(340px, 420px);

    ${variables.SCREEN_QUERY.BELOW_DESKTOP} {
        display: flex;
        flex-direction: column;
    }
`;
