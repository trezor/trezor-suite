import { UI } from 'trezor-connect';
import reducer from '@onboarding-reducers/onboardingReducer';
import { OnboardingReducer } from '@onboarding-types/onboarding';

const getUiRequestButtonPayload = () => ({
    code: 'bar',
    device: {},
    data: {},
});

const getUiRequestPinPayload = () => ({
    device: {},
});

const getInitialState = () => ({
    uiInteraction: {
        name: undefined,
        counter: 0,
    },
});

// limit types only to those of interest for this test suite;
type PartialState = Pick<OnboardingReducer, 'uiInteraction'>;
type PartialReducer = (state: PartialState, action: any) => PartialState;
// need to retype to unknown first, typescript wants it.
const onboardingReducer = (reducer as unknown) as PartialReducer;

describe('onboarding reducer', () => {
    describe('setInteraction', () => {
        it('same events should KEEP name and INCREMENT counter', () => {
            const stateAfterFirstEvent = onboardingReducer(getInitialState(), {
                type: UI.REQUEST_BUTTON,
                payload: getUiRequestButtonPayload(),
            });

            expect(stateAfterFirstEvent).toMatchObject({
                uiInteraction: {
                    counter: 0,
                    name: 'bar',
                },
            });

            const stateAfterSecondEvent = onboardingReducer(stateAfterFirstEvent, {
                type: UI.REQUEST_BUTTON,
                payload: getUiRequestButtonPayload(),
            });

            expect(stateAfterSecondEvent).toMatchObject({
                uiInteraction: {
                    counter: 1,
                    name: 'bar',
                },
            });
        });

        it('different events should CHANGE name and RESET counter', () => {
            const stateAfterFirstEvent = onboardingReducer(getInitialState(), {
                type: UI.REQUEST_BUTTON,
                payload: getUiRequestButtonPayload(),
            });

            expect(stateAfterFirstEvent).toMatchObject({
                uiInteraction: {
                    counter: 0,
                    name: 'bar',
                },
            });

            const stateAfterSecondEvent = onboardingReducer(stateAfterFirstEvent, {
                type: UI.REQUEST_PIN,
                payload: getUiRequestPinPayload(),
            });

            expect(stateAfterSecondEvent).toMatchObject({
                uiInteraction: {
                    counter: 0,
                    name: UI.REQUEST_PIN,
                },
            });
        });
    });
});
