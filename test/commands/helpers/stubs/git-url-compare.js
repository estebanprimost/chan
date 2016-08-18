export default function gitUrlCompare(gitCompare) {
    return new Promise((resolve) => {
        if (gitCompare) {
            return resolve(gitCompare);
        }

        return resolve('https://github.com/geut/chan/compare/<from>...<to>');
    });
}
