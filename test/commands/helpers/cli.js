import createFixture from './create-fixture';
import readChangelog from './read-changelog';
import proxyquire from 'proxyquire';
import logStub from './stubs/log';

const cliInstance = proxyquire('../../../src/cli/index', { './lib/log': logStub });

function cli(tmp, commands, fixtureName) {
    const fixture = createFixture(tmp, commands, fixtureName, fixtureName !== 'empty');

    const execute = (Array.isArray(commands) ? commands : [commands]).reduce((exec, command) => {
        for (let value of cliInstance.commands()) {
            if (value.name === command.name) {
                if (command.args === undefined) {
                    command.args = {};
                }
                command.args.path = fixture;
                command.args.silence = true;

                return exec.then(() => {
                    return value.handler(command.args);
                });
            }
        }
        return exec.then(() => Promise.reject());
    }, Promise.resolve());

    return execute
        .then(() => {
            return readChangelog(fixture);
        });
}

export default cli;
