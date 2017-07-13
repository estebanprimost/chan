import { equal } from 'assert';
import gitconfig from 'gitconfiglocal';
import pify from 'pify';
import gitUrlParse from 'git-url-parse';

const dots = (source) => {
    let separator = '..';
    if (source === 'github.com') {
        separator = '...';
    }
    return separator;
};

export function defineGITCompare(url) {
    equal(typeof url, 'string', 'chan: expects a git url to compare. Maybe you are on a non-git repo?');
    let parseUrl = gitUrlParse(url);
    return `${parseUrl.toString('https')}/compare/<from>${dots(parseUrl.source)}<to>`;
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

    return request.then(urlObj => {
        if (urlObj.fromUser) {
            return urlObj.url;
        }

        return defineGITCompare(urlObj.url);
    });
}
