import colors, { THEME } from './config/colors';
import * as variables from './config/variables';
import { useTheme } from './utils';
import { SuiteThemeColors } from './support/types';

import { Button, ButtonProps } from './components/buttons/Button';
import { Flag, FlagProps } from './components/Flag';
import { ButtonPin, ButtonPinProps } from './components/buttons/Pin';
import { DeviceImage, DeviceImageProps } from './components/DeviceImage';
import {
    Dropdown,
    DropdownRef,
    DropdownProps,
    DropdownMenuItemProps,
    DropdownMenuProps,
} from './components/Dropdown';
import { Input, InputProps } from './components/form/Input';
import { Textarea, TextareaProps } from './components/form/Textarea';
import { Select, SelectProps } from './components/form/Select';
import { Checkbox, CheckboxProps } from './components/form/Checkbox';
import { RadioButton, RadioButtonProps } from './components/form/RadioButton';
import { Switch, SwitchProps } from './components/form/Switch';
import { Icon, IconProps } from './components/Icon';
import { H1, H2 } from './components/typography/Heading';
import { P, PProps } from './components/typography/Paragraph';
import { Link, LinkProps } from './components/typography/Link';
import { Box, BoxProps } from './components/others/Box';
import { Card, CardProps } from './components/others/Card';
import { SecurityCard, SecurityCardProps } from './components/others/SecurityCard';
import { ConfirmOnDevice, ConfirmOnDeviceProps } from './components/prompts/ConfirmOnDevice';
import { Modal, ModalProps } from './components/Modal';
import { CoinLogo, CoinLogoProps } from './components/logos/CoinLogo';
import { TrezorLogo, TrezorLogoProps } from './components/logos/TrezorLogo';
import { Loader, LoaderProps } from './components/loaders/Loader';
import { Tooltip, TooltipProps, tooltipGlobalStyles } from './components/Tooltip';
import { scrollbarStyles } from './components/Scrollbar';
import { Timerange, TimerangeProps } from './components/Timerange';
import { Truncate } from './components/Truncate';
import { SelectBar, SelectBarProps } from './components/form/SelectBar';
import { ThemeProvider, ThemeContext } from './support/ThemeProvider';
import * as types from './support/types';

export {
    colors,
    THEME,
    variables,
    Button,
    ButtonProps,
    ButtonPin,
    ButtonPinProps,
    Dropdown,
    DropdownRef,
    DropdownProps,
    DropdownMenuItemProps,
    DropdownMenuProps,
    Input,
    InputProps,
    Textarea,
    TextareaProps,
    Select,
    SelectProps,
    Checkbox,
    CheckboxProps,
    RadioButton,
    RadioButtonProps,
    Switch,
    SwitchProps,
    Icon,
    IconProps,
    H1,
    H2,
    P,
    PProps,
    Link,
    LinkProps,
    Modal,
    ModalProps,
    CoinLogo,
    CoinLogoProps,
    TrezorLogo,
    TrezorLogoProps,
    Loader,
    LoaderProps,
    Tooltip,
    TooltipProps,
    tooltipGlobalStyles,
    Timerange,
    TimerangeProps,
    Truncate,
    types,
    ConfirmOnDevice,
    ConfirmOnDeviceProps,
    DeviceImage,
    DeviceImageProps,
    Box,
    BoxProps,
    Card,
    CardProps,
    SecurityCard,
    SecurityCardProps,
    SelectBar,
    SelectBarProps,
    Flag,
    FlagProps,
    useTheme,
    SuiteThemeColors,
    scrollbarStyles,
    ThemeProvider,
    ThemeContext,
};
