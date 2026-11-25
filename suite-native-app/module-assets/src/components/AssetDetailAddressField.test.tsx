import { getDefaultStore } from 'jotai';

import { AlertRenderer } from '@suite-native/alerts';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { getTranslation } from '@suite-native/intl';
import {
    createLightStore,
    createStaticReducer,
    createStoreFromPreloadedState,
    fireEvent,
    renderWithStoreProvider,
    screen,
} from '@suite-native/test-utils-store';

import { AssetDetailAddressField } from './AssetDetailAddressField';
import { hasTokenCopyWarningBeenDisabledAtom } from '../tokenAddressCopyWarningAtoms';

const mockCopyToClipboard = jest.fn();
const mockReport = jest.fn();

jest.mock('@suite-native/clipboard', () => ({
    useCopyToClipboard: () => mockCopyToClipboard,
}));

const CONTRACT_ADDRESS = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
const COPY_BUTTON = '@asset-detail/settings/contract-address/copy';
const DO_NOT_SHOW_AGAIN_CHECKBOX =
    '@asset-detail/settings/copy-address-warning-alert/do-not-show-again';

const alertTranslation = 'moduleAssets.assetDetailScreen.settings.copyAddressWarningAlert';
const warningTitle = getTranslation(`${alertTranslation}.title`);
const confirmButton = getTranslation(`${alertTranslation}.confirmButton`);

const copyEvent = {
    type: 'app/copy-to-clipboard',
    payload: { from: 'asset-detail', type: 'contractAddress' },
};

const renderAddressField = async () => {
    const { wallet, locale } = createStoreFromPreloadedState().getState();
    const store = createLightStore({
        reducer: {
            wallet: createStaticReducer(wallet),
            locale: createStaticReducer(locale),
        },
    });

    await renderWithStoreProvider(
        <>
            <AssetDetailAddressField
                label="Contract address"
                value={CONTRACT_ADDRESS}
                addressType="contract"
                testID="@asset-detail/settings/contract-address"
            />
            <AlertRenderer />
        </>,
        { services: { store, analytics: mockNativeAnalytics(mockReport) } },
    );
};

const getHasWarningBeenDisabled = () => getDefaultStore().get(hasTokenCopyWarningBeenDisabledAtom);

describe('AssetDetailAddressField', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        getDefaultStore().set(hasTokenCopyWarningBeenDisabledAtom, false);
    });

    it('warns before copying and copies once the user confirms', async () => {
        await renderAddressField();

        await fireEvent.press(screen.getByTestId(COPY_BUTTON));

        expect(screen.getByText(warningTitle)).toBeOnTheScreen();
        expect(
            screen.getByText(getTranslation(`${alertTranslation}.description.contract`)),
        ).toBeOnTheScreen();
        expect(mockCopyToClipboard).not.toHaveBeenCalled();
        expect(mockReport).not.toHaveBeenCalled();

        await fireEvent.press(screen.getByText(confirmButton));

        expect(mockCopyToClipboard).toHaveBeenCalledWith(CONTRACT_ADDRESS);
        expect(mockReport).toHaveBeenCalledWith(copyEvent);
    });

    it('copies nothing and keeps warning when the user cancels with the checkbox ticked', async () => {
        await renderAddressField();

        await fireEvent.press(screen.getByTestId(COPY_BUTTON));
        await fireEvent.press(screen.getByTestId(DO_NOT_SHOW_AGAIN_CHECKBOX));
        await fireEvent.press(screen.getByText(getTranslation('generic.buttons.cancel')));

        expect(mockCopyToClipboard).not.toHaveBeenCalled();
        expect(mockReport).not.toHaveBeenCalled();
        expect(getHasWarningBeenDisabled()).toBe(false);
    });

    it('copies without warning after the user confirms with the checkbox ticked', async () => {
        await renderAddressField();

        await fireEvent.press(screen.getByTestId(COPY_BUTTON));
        await fireEvent.press(screen.getByTestId(DO_NOT_SHOW_AGAIN_CHECKBOX));
        await fireEvent.press(screen.getByText(confirmButton));

        expect(getHasWarningBeenDisabled()).toBe(true);
        expect(mockCopyToClipboard).toHaveBeenCalledTimes(1);

        expect(screen.queryByText(warningTitle)).toBeNull();
        await fireEvent.press(screen.getByTestId(COPY_BUTTON));

        expect(screen.queryByText(warningTitle)).toBeNull();
        expect(mockCopyToClipboard).toHaveBeenCalledTimes(2);
        expect(mockReport).toHaveBeenCalledTimes(2);
    });

    it('does not carry a ticked checkbox over to the next warning', async () => {
        await renderAddressField();

        await fireEvent.press(screen.getByTestId(COPY_BUTTON));
        await fireEvent.press(screen.getByTestId(DO_NOT_SHOW_AGAIN_CHECKBOX));
        await fireEvent.press(screen.getByText(getTranslation('generic.buttons.cancel')));

        expect(screen.queryByText(warningTitle)).toBeNull();
        await fireEvent.press(screen.getByTestId(COPY_BUTTON));
        await fireEvent.press(screen.getByText(confirmButton));

        expect(mockCopyToClipboard).toHaveBeenCalledTimes(1);
        expect(getHasWarningBeenDisabled()).toBe(false);
    });
});
