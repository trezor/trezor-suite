import { Provider } from 'react-redux';

import { combineReducers } from '@reduxjs/toolkit';

import {
    configureMockStore,
    extraDependenciesCommonMock,
    render,
    screen,
} from '@suite-common/test-utils';

import { ExperimentWrapper } from '../ExperimentWrapper';
import { createMessageSystemState } from '../__fixtures__/createMessageSystemState';
import { messageSystemInitialState, prepareMessageSystemReducer } from '../messageSystemReducer';
import { ExperimentId, type MessageSystemState } from '../messageSystemTypes';

const messageSystemReducer = prepareMessageSystemReducer(extraDependenciesCommonMock);

const createStore = (messageSystem: MessageSystemState) =>
    configureMockStore({
        extra: {},
        reducer: combineReducers({
            messageSystem: messageSystemReducer,
            analytics: (state = { instanceId: 'test-instance-id' }) => state,
        }),
        preloadedState: { messageSystem } as { messageSystem: MessageSystemState },
    });

const defaultComponents = [
    { variant: 'A', element: <div>variant A</div> },
    { variant: 'B', element: <div>variant B</div> },
];

const renderWrapper = ({
    messageSystem = createMessageSystemState(),
    components = defaultComponents,
}: {
    messageSystem?: MessageSystemState;
    components?: typeof defaultComponents;
} = {}) =>
    render(
        <Provider store={createStore(messageSystem)}>
            <ExperimentWrapper id={ExperimentId.tradingFeedbackForm} components={components} />
        </Provider>,
    );

describe('ExperimentWrapper', () => {
    it('renders the default (first) component when experiment is not valid', () => {
        renderWrapper({ messageSystem: messageSystemInitialState });

        expect(screen.getByText('variant A')).toBeDefined();
    });

    it('renders the component matching the active variant', () => {
        renderWrapper({ messageSystem: createMessageSystemState({ inclusionOverride: 99 }) });

        expect(screen.getByText('variant B')).toBeDefined();
    });

    it('renders the matching component when config defines more groups than code', () => {
        renderWrapper({
            messageSystem: createMessageSystemState({
                groups: [
                    { variant: 'A', percentage: 30 },
                    { variant: 'B', percentage: 40 },
                    { variant: 'C', percentage: 30 },
                ],
                inclusionOverride: 50,
            }),
        });

        expect(screen.getByText('variant B')).toBeDefined();
    });

    it('renders the default component when active variant has no component', () => {
        renderWrapper({
            messageSystem: createMessageSystemState({ inclusionOverride: 99 }),
            components: [
                { variant: 'A', element: <div>variant A</div> },
                { variant: 'C', element: <div>variant C</div> },
            ],
        });

        expect(screen.getByText('variant A')).toBeDefined();
    });
});
