import * as React from 'react';
import { IntlProvider, addLocaleData } from 'react-intl';
import { connect } from 'react-redux';

import en from 'react-intl/locale-data/en';
import cs from 'react-intl/locale-data/cs';
import bn from 'react-intl/locale-data/bn';
import de from 'react-intl/locale-data/de';
import el from 'react-intl/locale-data/el';
import es from 'react-intl/locale-data/es';
import fr from 'react-intl/locale-data/fr';
import id from 'react-intl/locale-data/id';
import it from 'react-intl/locale-data/it';
import ja from 'react-intl/locale-data/ja';
import nl from 'react-intl/locale-data/nl';
import pl from 'react-intl/locale-data/pl';
import pt from 'react-intl/locale-data/pt';
import ru from 'react-intl/locale-data/ru';
import uk from 'react-intl/locale-data/uk';
import zh from 'react-intl/locale-data/zh';

addLocaleData([
    ...en,
    ...cs,
    ...bn,
    ...de,
    ...el,
    ...es,
    ...fr,
    ...id,
    ...it,
    ...ja,
    ...nl,
    ...pl,
    ...pt,
    ...ru,
    ...uk,
    ...zh,
]);

const mapStateToProps = state => ({
    locale: 'en',
    messages: {},
});

const ReactIntlProvider = ({ children, locale, messages }) => (
    <IntlProvider
        locale={locale}
        messages={messages}
        key={locale} // forces rerender IntlProvider when lang file is downloaded
    >
        {children}
    </IntlProvider>
);

export default connect(mapStateToProps)(ReactIntlProvider);
