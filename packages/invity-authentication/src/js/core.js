/** Adds checkbox click event listeners. Checkbox is a div element (not input type="checkbox"). */
function addCheckboxClickEventListeners() {
    const checkboxWrapper = document.querySelector('.checkbox-wrapper');
    const checkbox = document.querySelector('.checkbox');
    const checkboxCheckedIcon = document.querySelector('.checkbox-checked-icon');
    const checkboxInput = document.querySelector('.checkbox-input');
    const handleCheckboxClick = () => {
        checkbox?.classList.toggle('checked');
        checkbox?.classList.toggle('unchecked');
        checkboxCheckedIcon?.classList.toggle('hidden', checkbox?.classList.contains('unchecked'));
        checkboxInput.checked = !checkbox?.classList.contains('unchecked');
    };
    checkboxWrapper?.addEventListener('click', handleCheckboxClick);
}

const InvityAuthenticationThemeKey = 'invity-authentication-theme';
/** Ensures dark mode class is applied to document.body if needed. */
function ensureTheme() {
    // NOTE: Need to store applied theme to storage, because
    const searchParams = new URLSearchParams(document.location.search);
    let themeEffective = searchParams.get(InvityAuthenticationThemeKey);
    if (!themeEffective) {
        themeEffective = sessionStorage.getItem(InvityAuthenticationThemeKey);
    } else {
        sessionStorage.setItem(InvityAuthenticationThemeKey, themeEffective);
    }
    if (themeEffective === 'dark') {
        document.body.classList.add(themeEffective);
    }
}

function ensureInputFocus() {
    // NOTE: Without setTimeout the focus does not work.
    setTimeout(() => {
        document.querySelector('#email')?.focus();
    }, 100);
}

window.addEventListener('DOMContentLoaded', _ => {
    addCheckboxClickEventListeners();
    ensureTheme();
    ensureInputFocus();
});
