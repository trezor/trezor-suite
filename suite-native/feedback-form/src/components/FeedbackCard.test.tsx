import { BottomSheetModal } from '@gorhom/bottom-sheet';

import { getTranslation } from '@suite-native/intl';
import { act, fireEvent, renderWithBasicProvider, screen } from '@suite-native/test-utils';

import { FeedbackCard } from './FeedbackCard';

const HEADING = getTranslation('feedbackForm.title');
const DESCRIPTION = getTranslation('feedbackForm.description');
const SUBMIT_LABEL = getTranslation('feedbackForm.submitButton');
const SUCCESS_HEADING = getTranslation('feedbackForm.successTitle');
const SUCCESS_DESCRIPTION = getTranslation('feedbackForm.successDescription');
const CLOSE_LABEL = getTranslation('generic.buttons.close');

const expectSheetRatingSelection = (rating: string, isSelected: boolean) => {
    expect(screen.getByTestId(`@feedback-form/sheet/rating/${rating}`)).toHaveProp(
        'accessibilityState',
        expect.objectContaining({ selected: isSelected }),
    );
};

describe('FeedbackCard', () => {
    const onSubmit = jest.fn();
    const onRatingSelect = jest.fn();
    const presentSpy = jest.spyOn(BottomSheetModal.prototype, 'present');
    const dismissSpy = jest.spyOn(BottomSheetModal.prototype, 'dismiss');

    const renderFeedbackCard = async (props?: Partial<Parameters<typeof FeedbackCard>[0]>) =>
        await renderWithBasicProvider(
            <FeedbackCard
                heading={HEADING}
                description={DESCRIPTION}
                submitLabel={SUBMIT_LABEL}
                successHeading={SUCCESS_HEADING}
                successDescription={SUCCESS_DESCRIPTION}
                closeLabel={CLOSE_LABEL}
                onSubmit={onSubmit}
                {...props}
            />,
        );

    const dismissSheet = async () => {
        const sheetInstance = presentSpy.mock.contexts[0];
        await act(() => {
            sheetInstance.dismiss();
        });
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('shows the heading and the five rating buttons in the card', async () => {
        await renderFeedbackCard();

        expect(screen.getByText(HEADING)).toBeOnTheScreen();
        ['1', '2', '3', '4', '5'].forEach(rating => {
            expect(screen.getByTestId(`@feedback-form/rating/${rating}`)).toBeOnTheScreen();
        });
    });

    it('opens the feedback sheet with the pressed rating preselected', async () => {
        await renderFeedbackCard();

        await fireEvent.press(screen.getByTestId('@feedback-form/rating/4'));

        expect(presentSpy).toHaveBeenCalledTimes(1);
        expectSheetRatingSelection('4', true);
        expectSheetRatingSelection('3', false);
    });

    it('allows changing the rating inside the sheet', async () => {
        await renderFeedbackCard();

        await fireEvent.press(screen.getByTestId('@feedback-form/rating/4'));
        await fireEvent.press(screen.getByTestId('@feedback-form/sheet/rating/2'));

        expectSheetRatingSelection('2', true);
        expectSheetRatingSelection('4', false);
        // Changing the rating inside the sheet must not present the sheet again.
        expect(presentSpy).toHaveBeenCalledTimes(1);
    });

    it('calls onRatingSelect when a card rating is pressed', async () => {
        await renderFeedbackCard({ onRatingSelect });

        await fireEvent.press(screen.getByTestId('@feedback-form/rating/4'));

        expect(onRatingSelect).toHaveBeenCalledTimes(1);
        expect(onRatingSelect).toHaveBeenCalledWith('4');
    });

    it('calls onRatingSelect again when the rating is changed inside the sheet', async () => {
        await renderFeedbackCard({ onRatingSelect });

        await fireEvent.press(screen.getByTestId('@feedback-form/rating/4'));
        await fireEvent.press(screen.getByTestId('@feedback-form/sheet/rating/2'));

        expect(onRatingSelect).toHaveBeenCalledTimes(2);
        expect(onRatingSelect).toHaveBeenLastCalledWith('2');
    });

    it('does not render the description row when no description is provided', async () => {
        await renderFeedbackCard({ description: undefined });

        expect(screen.queryByText(DESCRIPTION)).not.toBeOnTheScreen();
        expect(screen.getByTestId('@feedback-form/description-input')).toBeOnTheScreen();
    });

    it('does not submit while the feedback text is missing', async () => {
        await renderFeedbackCard();

        await fireEvent.press(screen.getByTestId('@feedback-form/rating/4'));
        await fireEvent.changeText(screen.getByTestId('@feedback-form/description-input'), '   ');
        await fireEvent.press(screen.getByTestId('@feedback-form/submit-button'));

        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('submits the rating and feedback, then shows the success view without closing the sheet', async () => {
        await renderFeedbackCard();

        await fireEvent.press(screen.getByTestId('@feedback-form/rating/5'));
        await fireEvent.changeText(
            screen.getByTestId('@feedback-form/description-input'),
            'Smooth and fast',
        );
        await fireEvent.press(screen.getByTestId('@feedback-form/submit-button'));

        expect(onSubmit).toHaveBeenCalledWith('5', 'Smooth and fast');
        // Both the sheet and the card behind it switch to the success view.
        expect(screen.getAllByText(SUCCESS_HEADING)).toHaveLength(2);
        expect(screen.getAllByText(SUCCESS_DESCRIPTION)).toHaveLength(2);
        expect(screen.getByTestId('@feedback-form/close-button')).toBeOnTheScreen();
        // The card form is gone in the success view.
        expect(screen.queryByText(HEADING)).not.toBeOnTheScreen();
        // The sheet stays open until the user closes it.
        expect(dismissSpy).not.toHaveBeenCalled();
    });

    it('closes the sheet when the close button is pressed after submitting', async () => {
        await renderFeedbackCard();

        await fireEvent.press(screen.getByTestId('@feedback-form/rating/5'));
        await fireEvent.changeText(
            screen.getByTestId('@feedback-form/description-input'),
            'Smooth and fast',
        );
        await fireEvent.press(screen.getByTestId('@feedback-form/submit-button'));
        await fireEvent.press(screen.getByTestId('@feedback-form/close-button'));

        expect(dismissSpy).toHaveBeenCalledTimes(1);
        // The card keeps the success view after the sheet is closed.
        expect(screen.getAllByText(SUCCESS_HEADING).length).toBeGreaterThan(0);
    });

    it('resets the form when the sheet is dismissed without submitting', async () => {
        await renderFeedbackCard();

        await fireEvent.press(screen.getByTestId('@feedback-form/rating/3'));
        await fireEvent.changeText(
            screen.getByTestId('@feedback-form/description-input'),
            'Draft text',
        );

        await dismissSheet();

        expectSheetRatingSelection('3', false);
        expect(screen.getByTestId('@feedback-form/description-input')).toHaveProp('value', '');
        // The card stays in the form view.
        expect(screen.getByText(HEADING)).toBeOnTheScreen();
    });

    it('renders the success view directly when defaultView is "success"', async () => {
        await renderFeedbackCard({ defaultView: 'success' });

        expect(screen.getAllByText(SUCCESS_HEADING).length).toBeGreaterThan(0);
        expect(screen.queryByText(HEADING)).not.toBeOnTheScreen();
    });
});
