import { variables } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';

export const TradingWrapper = `
    gap: ${spacingsPx.md};
    display: grid;
    grid-template-columns: 1fr 420px;

    ${variables.SCREEN_QUERY.BELOW_DESKTOP} {
        display: flex;
        flex-direction: column;
    }
`;
