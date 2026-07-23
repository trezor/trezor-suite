import { variables } from '@trezor/components';
export const TradingWrapper = `
    gap: 16px;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 420px;

    ${variables.SCREEN_QUERY.BELOW_DESKTOP} {
        display: flex;
        flex-direction: column;
    }
`;
