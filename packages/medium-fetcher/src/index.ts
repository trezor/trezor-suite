import axios from 'axios';

const URL = `https://medium.com/@satoshilabs?format=json`;

const parse = json => {
    const data = JSON.parse(json);
    console.log(data);
    return data;
};

export default callback => {
    return axios.get(URL).then((response: any) => {
        const result = response.data.replace(`])}while(1);</x>`, '');
        const parsed = parse(result);
        callback(result);
    });
};
