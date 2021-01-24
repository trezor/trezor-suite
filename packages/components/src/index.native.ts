import colors, { THEME } from './config/colors';
import * as variables from './config/variables';
import { useTheme } from './utils';
import { SuiteThemeColors } from './support/types';
import { Button } from './components/buttons/Button';
import { ButtonPin } from './components/buttons/Pin';
import { DeviceImage } from './components/DeviceImage';
import { Dropdown } from './components/Dropdown';
import { Input } from './components/form/Input';
import { Textarea } from './components/form/Textarea';
import { Select } from './components/form/Select';
import { Checkbox } from './components/form/Checkbox';
import { Switch } from './components/form/Switch';
import { Icon } from './components/Icon';
import { H1, H2 } from './components/typography/Heading';
import { P } from './components/typography/Paragraph';
import { Link } from './components/typography/Link';
import { Box } from './components/others/Box';
import { Card } from './components/others/Card';
import { SecurityCard } from './components/others/SecurityCard';
import { ConfirmOnDevice } from './components/prompts/ConfirmOnDevice';
import { Modal } from './components/Modal';
import { CoinLogo } from './components/logos/CoinLogo';
import { TrezorLogo } from './components/logos/TrezorLogo';
import { Loader } from './components/loaders/Loader';
import { Tooltip } from './components/Tooltip';
import { scrollbarStyles } from './components/Scrollbar';
import { Timerange } from './components/Timerange';
import { SelectBar } from './components/form/SelectBar';
import { ThemeProvider, ThemeContext } from './support/ThemeProvider';
import {
    RN_FONT_SIZE,
    RN_FONT_WEIGHT,
    NEUE_FONT_SIZE as FONT_SIZE,
    FONT_WEIGHT,
    SCREEN_SIZE,
} from './config/variables';
import * as types from './support/types';

export {
    colors,
    THEME,
    variables,
    Button,
    ButtonPin,
    Dropdown,
    Input,
    Textarea,
    Select,
    Checkbox,
    Switch,
    Icon,
    H1,
    H2,
    P,
    P as Text,
    Link,
    Modal,
    CoinLogo,
    TrezorLogo,
    Loader,
    Tooltip,
    Timerange,
    types,
    ConfirmOnDevice,
    DeviceImage,
    Box,
    Card,
    SecurityCard,
    SelectBar,
    useTheme,
    SuiteThemeColors,
    scrollbarStyles,
    ThemeProvider,
    ThemeContext,
    RN_FONT_SIZE,
    RN_FONT_WEIGHT,
    FONT_SIZE,
    FONT_WEIGHT,
    SCREEN_SIZE,
};
