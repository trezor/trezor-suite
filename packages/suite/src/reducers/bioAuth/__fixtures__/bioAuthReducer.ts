import { bioAuthActions } from 'src/actions/suite/bioAuthActions';

import { BioAuthState } from '../index';

const initialState: BioAuthState = {
    bioAuthEnabled: false,
    initialNow: 0,
    blurTimeoutId: null,
    bioAuthEnabledNextValue: null,
    lastBioAuthValidatedTimestamp: null,
    bioAuthValidationRequired: false,
    lastWindowBlurTimestamp: null,
    bioAuthValidationInProgress: false,
    bioAuthValidationRequested: false,
    windowBlurred: false,
    bioAuthAvailable: null,
};

// Mock date for consistent testing
const TEST_DATE = '2023-01-01T12:00:00Z';
const TEST_DATE_TIMESTAMP = new Date(TEST_DATE).getTime();
const TEST_DATE_PLUS_6_MIN = '2023-01-01T12:06:00Z';
const TEST_DATE_PLUS_25_HOURS = '2023-01-02T13:00:00Z';

export default {
    setBioAuthEnabled: [
        {
            description: 'Enable bioAuth',
            initialState,
            actions: [bioAuthActions.setBioAuthEnabled(true)],
            result: {
                ...initialState,
                bioAuthEnabled: true,
            },
        },
        {
            description: 'Disable bioAuth',
            initialState: {
                ...initialState,
                bioAuthEnabled: true,
            },
            actions: [bioAuthActions.setBioAuthEnabled(false)],
            result: {
                ...initialState,
                bioAuthEnabled: false,
            },
        },
    ],
    requestBioAuthChange: [
        {
            description: 'Request to enable bioAuth',
            initialState,
            actions: [bioAuthActions.requestBioAuthChange(true)],
            result: {
                ...initialState,
                bioAuthEnabledNextValue: true,
                bioAuthValidationRequested: true,
            },
        },
        {
            description: 'Request to disable bioAuth',
            initialState: {
                ...initialState,
                bioAuthEnabled: true,
            },
            actions: [bioAuthActions.requestBioAuthChange(false)],
            result: {
                ...initialState,
                bioAuthEnabled: true,
                bioAuthEnabledNextValue: false,
                bioAuthValidationRequested: true,
            },
        },
    ],
    requestBioAuthChangeEnd: [
        {
            description: 'End bioAuth change request',
            initialState: {
                ...initialState,
                bioAuthEnabledNextValue: true,
            },
            actions: [bioAuthActions.requestBioAuthChangeEnd()],
            result: {
                ...initialState,
                bioAuthEnabledNextValue: null,
            },
        },
    ],
    bioAuthValidated: [
        {
            description: 'BioAuth validation successful with timestamp',
            initialState: {
                ...initialState,
                bioAuthValidationRequested: true,
                lastWindowBlurTimestamp: TEST_DATE_TIMESTAMP,
                windowBlurred: true,
            },
            actions: [bioAuthActions.bioAuthValidated(TEST_DATE)],
            result: {
                ...initialState,
                lastBioAuthValidatedTimestamp: TEST_DATE_TIMESTAMP,
                bioAuthValidationRequested: false,
                lastWindowBlurTimestamp: null,
                windowBlurred: false,
            },
        },
        {
            description: 'BioAuth validation with null timestamp',
            initialState: {
                ...initialState,
                bioAuthValidationRequested: true,
                lastWindowBlurTimestamp: TEST_DATE_TIMESTAMP,
                windowBlurred: true,
            },
            actions: [bioAuthActions.bioAuthValidated(null)],
            result: {
                ...initialState,
                lastBioAuthValidatedTimestamp: null,
                bioAuthValidationRequested: false,
                lastWindowBlurTimestamp: null,
                windowBlurred: false,
            },
        },
    ],
    bioAuthWindowBlur: [
        {
            description: 'Window blur event',
            initialState,
            actions: [
                bioAuthActions.bioAuthWindowBlur({
                    blurDate: TEST_DATE,
                    timeoutId: 1 as unknown as NodeJS.Timeout,
                }),
            ],
            result: {
                ...initialState,
                lastWindowBlurTimestamp: TEST_DATE_TIMESTAMP,
                windowBlurred: true,
                blurTimeoutId: 1 as unknown as NodeJS.Timeout,
            },
        },
    ],
    bioAuthWindowFocus: [
        {
            description: 'Window focus event after long blur (more than 5 minutes)',
            initialState: {
                ...initialState,
                lastWindowBlurTimestamp: TEST_DATE_TIMESTAMP,
                windowBlurred: true,
            },
            actions: [bioAuthActions.bioAuthWindowFocus(TEST_DATE_PLUS_6_MIN)],
            result: {
                ...initialState,
                windowBlurred: false,
            },
        },
        {
            description:
                'Window focus event after long blur (less than 5 minutes) - nullify the lastWindowBlurTimestamp',
            initialState: {
                ...initialState,
                lastWindowBlurTimestamp: TEST_DATE_TIMESTAMP,
                windowBlurred: true,
            },
            actions: [
                bioAuthActions.bioAuthWindowFocus(
                    new Date(TEST_DATE_TIMESTAMP + 100).toISOString(),
                ),
            ],
            result: {
                ...initialState,
                lastWindowBlurTimestamp: null,
                windowBlurred: false,
            },
        },
        {
            description: 'Window focus event with null lastWindowBlurTimestamp',
            initialState: {
                ...initialState,
                lastWindowBlurTimestamp: null,
                windowBlurred: true,
            },
            actions: [bioAuthActions.bioAuthWindowFocus(TEST_DATE)],
            result: {
                ...initialState,
                lastWindowBlurTimestamp: null,
                windowBlurred: false,
            },
        },
    ],
    toggleBioAuthValidationRequested: [
        {
            description: 'Enable bioAuth validation request',
            initialState,
            actions: [bioAuthActions.toggleBioAuthValidationRequested(true)],
            result: {
                ...initialState,
                bioAuthValidationRequested: true,
            },
        },
        {
            description: 'Disable bioAuth validation request',
            initialState: {
                ...initialState,
                bioAuthValidationRequested: true,
            },
            actions: [bioAuthActions.toggleBioAuthValidationRequested(false)],
            result: {
                ...initialState,
                bioAuthValidationRequested: false,
            },
        },
    ],
    setBioAuthAvailable: [
        {
            description: 'Set bioAuth as available',
            initialState,
            actions: [bioAuthActions.setBioAuthAvailable(true)],
            result: {
                ...initialState,
                bioAuthAvailable: true,
            },
        },
        {
            description: 'Set bioAuth as unavailable',
            initialState: {
                ...initialState,
                bioAuthAvailable: true,
            },
            actions: [bioAuthActions.setBioAuthAvailable(false)],
            result: {
                ...initialState,
                bioAuthAvailable: false,
            },
        },
    ],
    selectorsTests: [
        {
            description: 'Test selectIsBioAuthValidationRequired when bioAuth is disabled',
            initialState: {
                ...initialState,
                bioAuthEnabled: false,
            },
            testSelector: 'selectIsBioAuthValidationRequired',
            expectedResult: false,
        },
        {
            description:
                'Test selectIsBioAuthValidationRequired when lastBioAuthValidatedTimestamp is null',
            initialState: {
                ...initialState,
                bioAuthEnabled: true,
                lastBioAuthValidatedTimestamp: null,
            },
            testSelector: 'selectIsBioAuthValidationRequired',
            expectedResult: true,
        },
        {
            description:
                'Test selectIsBioAuthValidationRequired when validation is expired (more than 24 hours)',
            initialState: {
                ...initialState,
                bioAuthEnabled: true,
                lastBioAuthValidatedTimestamp: TEST_DATE_TIMESTAMP,
            },
            testSelector: 'selectIsBioAuthValidationRequired',
            testSelectorParams: new Date(TEST_DATE_PLUS_25_HOURS),
            expectedResult: true,
        },
        {
            description: 'Test selectIsBioAuthValidationRequired when window was blurred too long',
            initialState: {
                ...initialState,
                bioAuthEnabled: true,
                lastBioAuthValidatedTimestamp: TEST_DATE_TIMESTAMP,
                lastWindowBlurTimestamp: TEST_DATE_TIMESTAMP,
            },
            testSelector: 'selectIsBioAuthValidationRequired',
            testSelectorParams: new Date(TEST_DATE_PLUS_6_MIN),
            expectedResult: true,
        },
        {
            description: 'Test selectIsAppUiHidden when window is blurred and bioAuth is enabled',
            initialState: {
                ...initialState,
                bioAuthEnabled: true,
                windowBlurred: true,
            },
            testSelector: 'selectIsAppUiHidden',
            expectedResult: true,
        },
        {
            description:
                'Test selectIsAppUiHidden when bioAuth validation is requested and bioAuth is enabled',
            initialState: {
                ...initialState,
                bioAuthEnabled: true,
                bioAuthValidationRequested: true,
            },
            testSelector: 'selectIsAppUiHidden',
            expectedResult: true,
        },
    ],
};
