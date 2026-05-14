import type { NetworkType } from '@suite-common/wallet-config';
import { Text } from '@suite-native/atoms';
import { getTranslation } from '@suite-native/intl';
import { renderWithBasicProvider } from '@suite-native/test-utils';

import { FeeLabelTranslation } from '../FeeLabelTranslation';

describe('FeeLabelTranslation', () => {
    const renderFeeLabelTranslation = (networkType: NetworkType) =>
        renderWithBasicProvider(
            <Text>
                <FeeLabelTranslation networkType={networkType} />
            </Text>,
        );

    it('should render "Maximum fee" for [ethereum]', () => {
        const { getByText } = renderFeeLabelTranslation('ethereum');

        expect(
            getByText(getTranslation('transactionManagement.fees.description.title.ethereum')),
        ).toBeOnTheScreen();
    });

    it.each<NetworkType>(['bitcoin', 'cardano', 'solana'])(
        'should render "Transaction fee" for [%s]',
        networkType => {
            const { getByText } = renderFeeLabelTranslation(networkType);

            expect(
                getByText(getTranslation('transactionManagement.fees.description.title.general')),
            ).toBeOnTheScreen();
        },
    );
});
