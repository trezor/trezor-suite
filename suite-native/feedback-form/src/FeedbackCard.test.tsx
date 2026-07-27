import { getTranslation } from '@suite-native/intl';
import { fireEvent, renderWithBasicProvider, screen } from '@suite-native/test-utils';

import { FeedbackCard } from './FeedbackCard';

const HEADING = getTranslation('feedbackForm.title');
const DESCRIPTION = getTranslation('feedbackForm.description');
const SUBMIT_LABEL = getTranslation('feedbackForm.submitButton');
const SUCCESS_HEADING = getTranslation('feedbackForm.successTitle');
const SUCCESS_DESCRIPTION = getTranslation('feedbackForm.successDescription');

describe('FeedbackCard', () => {
    const onSubmit = jest.fn();

    const renderFeedbackCard = (props?: Partial<Parameters<typeof FeedbackCard>[0]>) =>
        renderWithBasicProvider(
            <FeedbackCard
                heading={HEADING}
                description={DESCRIPTION}
                submitLabel={SUBMIT_LABEL}
                successHeading={SUCCESS_HEADING}
                successDescription={SUCCESS_DESCRIPTION}
                onSubmit={onSubmit}
                {...props}
            />,
        );

    beforeEach(() => {
        onSubmit.mockClear();
    });

    it('initially shows only the heading and the five rating buttons', () => {
        renderFeedbackCard();

        expect(screen.getByText(HEADING)).toBeOnTheScreen();
        ['1', '2', '3', '4', '5'].forEach(rating => {
            expect(screen.getByTestId(`@feedback-form/rating/${rating}`)).toBeOnTheScreen();
        });

        // Everything below the rating row stays hidden until a rating is picked.
        expect(screen.queryByText(DESCRIPTION)).not.toBeOnTheScreen();
        expect(screen.queryByTestId('@feedback-form/description-input')).not.toBeOnTheScreen();
        expect(screen.queryByTestId('@feedback-form/submit-button')).not.toBeOnTheScreen();
    });

    it('reveals the description, input and submit button once a rating is selected', () => {
        renderFeedbackCard();

        fireEvent.press(screen.getByTestId('@feedback-form/rating/4'));

        expect(screen.getByText(DESCRIPTION)).toBeOnTheScreen();
        expect(screen.getByTestId('@feedback-form/description-input')).toBeOnTheScreen();
        expect(screen.getByText(SUBMIT_LABEL)).toBeOnTheScreen();
    });

    it('does not render the description row when no description is provided', () => {
        renderFeedbackCard({ description: undefined });

        fireEvent.press(screen.getByTestId('@feedback-form/rating/4'));

        expect(screen.queryByText(DESCRIPTION)).not.toBeOnTheScreen();
        expect(screen.getByTestId('@feedback-form/description-input')).toBeOnTheScreen();
    });

    it('does not submit while the feedback text is missing', () => {
        renderFeedbackCard();

        fireEvent.press(screen.getByTestId('@feedback-form/rating/4'));
        fireEvent.changeText(screen.getByTestId('@feedback-form/description-input'), '   ');
        fireEvent.press(screen.getByTestId('@feedback-form/submit-button'));

        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('submits the rating and feedback, then switches to the success view', () => {
        renderFeedbackCard();

        fireEvent.press(screen.getByTestId('@feedback-form/rating/5'));
        fireEvent.changeText(
            screen.getByTestId('@feedback-form/description-input'),
            'Smooth and fast',
        );
        fireEvent.press(screen.getByTestId('@feedback-form/submit-button'));

        expect(onSubmit).toHaveBeenCalledWith('5', 'Smooth and fast');
        expect(screen.getByText(SUCCESS_HEADING)).toBeOnTheScreen();
        expect(screen.getByText(SUCCESS_DESCRIPTION)).toBeOnTheScreen();
        // Form controls are gone in the success view.
        expect(screen.queryByTestId('@feedback-form/submit-button')).not.toBeOnTheScreen();
    });

    it('renders the success view directly when defaultView is "success"', () => {
        renderFeedbackCard({ defaultView: 'success' });

        expect(screen.getByText(SUCCESS_HEADING)).toBeOnTheScreen();
        expect(screen.queryByText(HEADING)).not.toBeOnTheScreen();
    });
});
