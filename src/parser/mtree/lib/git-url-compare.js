import gitconfig from 'gitconfiglocal';
import pify from 'pify';
import gh from 'parse-github-url';

function defineGITCompare(url) {
    const parseUrl = gh(url);
    return `https://${parseUrl.host}/${parseUrl.repository}/compare/<from>...<to>`;
}


export default function gitUrlCompare(gitCompare) {
    let request;
    if (gitCompare) {
        request = Promise.resolve({ fromUser: true, url: gitCompare });
    } else {
        request = pify(gitconfig)(process.cwd())
            .then(config => {
                const url = config.remote && config.remote.origin && config.remote.origin.url;

                return { fromUser: false, url };
            });
    }

    return request.then((urlObj) => {
        if (urlObj.fromUser) {
            return urlObj.url;
        }

        return defineGITCompare(urlObj.url);
    });
}
