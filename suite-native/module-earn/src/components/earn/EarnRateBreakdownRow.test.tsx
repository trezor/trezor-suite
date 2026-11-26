import { renderWithBasicProvider } from '@suite-native/test-utils';

import { EarnRateBreakdownRow } from './EarnRateBreakdownRow';

describe(EarnRateBreakdownRow.name, () => {
    it('renders numeric zero in both optional fields', async () => {
        const { getAllByText } = await renderWithBasicProvider(
            <EarnRateBreakdownRow icon={null} symbol="ETH" value={0} description={0} />,
        );

        expect(getAllByText('0')).toHaveLength(2);
    });
});
