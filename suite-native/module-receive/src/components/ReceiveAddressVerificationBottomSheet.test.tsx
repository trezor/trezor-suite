import { getTranslation } from '@suite-native/intl';
import { ReceiveAddressVerificationSource } from '@suite-native/navigation';
import { renderWithBasicProvider, userEvent } from '@suite-native/test-utils';

import { ReceiveAddressVerificationBottomSheet } from './ReceiveAddressVerificationBottomSheet';

describe('ReceiveAddressVerificationBottomSheet', () => {
    const onVerifyAddress = jest.fn();
    const onSkipVerification = jest.fn();

    const renderBottomSheet = (
        source: ReceiveAddressVerificationSource = ReceiveAddressVerificationSource.Pasted,
    ) =>
        renderWithBasicProvider(
            <ReceiveAddressVerificationBottomSheet
                ref={{ current: null }}
                source={source}
                onVerifyAddress={onVerifyAddress}
                onSkipVerification={onSkipVerification}
            />,
        );

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders shared address instructions', () => {
        const { getByText, queryByText } = renderBottomSheet(
            ReceiveAddressVerificationSource.Shared,
        );

        expect(
            getByText(getTranslation('moduleReceive.addressSharedBottomSheet.title')),
        ).toBeOnTheScreen();
        expect(
            getByText(getTranslation('moduleReceive.addressSharedBottomSheet.subtitle')),
        ).toBeOnTheScreen();
        expect(
            queryByText(
                getTranslation('moduleReceive.addressCopiedBottomSheet.steps.pasteAddress'),
            ),
        ).not.toBeOnTheScreen();
    });

    it('renders verification instructions', () => {
        const { getByText } = renderBottomSheet();

        expect(
            getByText(getTranslation('moduleReceive.addressCopiedBottomSheet.title')),
        ).toBeOnTheScreen();
        expect(
            getByText(getTranslation('moduleReceive.addressCopiedBottomSheet.subtitle')),
        ).toBeOnTheScreen();
        expect(
            getByText(getTranslation('moduleReceive.addressCopiedBottomSheet.steps.pasteAddress')),
        ).toBeOnTheScreen();
        expect(
            getByText(getTranslation('moduleReceive.addressCopiedBottomSheet.steps.verifyAddress')),
        ).toBeOnTheScreen();
    });

    it('calls verification action', async () => {
        const { getByText } = renderBottomSheet();

        await userEvent.press(
            getByText(
                getTranslation('moduleReceive.addressCopiedBottomSheet.buttons.verifyOnTrezor'),
            ),
        );

        expect(onVerifyAddress).toHaveBeenCalledTimes(1);
    });

    it('calls skip action', async () => {
        const { getByText } = renderBottomSheet();

        await userEvent.press(
            getByText(
                getTranslation('moduleReceive.addressCopiedBottomSheet.buttons.skipVerification'),
            ),
        );

        expect(onSkipVerification).toHaveBeenCalledTimes(1);
    });
});
