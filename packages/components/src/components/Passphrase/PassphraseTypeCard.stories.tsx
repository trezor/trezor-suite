import { IntlProvider } from 'react-intl';
import { PassphraseTypeCard as PassphraseTypeCardComponent } from './PassphraseTypeCard';

export default {
    title: 'Loaders/PassphraseTypeCard',
    decorators: [
        (Story: React.FC) => (
            <IntlProvider locale="en">
                <Story />
            </IntlProvider>
        ),
    ],
    component: PassphraseTypeCardComponent,
};

export const PassphraseTypeCard = {
    args: {
        title: 'My Trezor',
        description:
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque ornare quam in justo auctor, in malesuada quam rhoncus. Phasellus sem eros, volutpat laoreet posuere non, feugiat et augue. ',
        submitLabel: 'Yes please',
        offerPassphraseOnDevice: true,
        singleColModal: true,
        authConfirmation: true,
        onSubmit: () => null,
    },
};
