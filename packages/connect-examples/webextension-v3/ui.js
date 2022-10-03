function getAddress() {
    console.log('get address');
    chrome.runtime.sendMessage(undefined, { message: 'TrezorConnect.getAddress' });
}

document.getElementById('getAddress').addEventListener('click', getAddress);

chrome.tabs.query({ active: true, currentWindow: true }, function (tab) {
    chrome.tabs.sendMessage(tab[0].id, { foo: 'baz' }, function (response) {
        console.log('callback ', response);
        //assuming that info was html markup then you could do
        document.getElementsByTagName('body')[0].innerHTML = JSON.stringify(response);

        //I personally wouldn't do it like this but you get the idea
    });
});
