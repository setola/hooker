import { Command, Option, InvalidArgumentError } from 'commander';
import { URL } from 'url';
import { HTTPVerb } from './HTTPVerb'
import { Hook } from './Hook'
import { readFileSync, writeFileSync } from 'fs';

const program = new Command();

var hooks: Hook[] = []

function loadConfig(cmd: Command) {
    let configFile = cmd.optsWithGlobals().config
    let config = readFileSync(configFile, 'utf-8')
    let rawHooks = JSON.parse(config)
    rawHooks.forEach((hook: any) => {
        hooks.push(Hook.parseFromJSON(hook))
    })
}

function saveConfig(cmd: Command) {
    let configFile = cmd.optsWithGlobals().config
    writeFileSync(configFile, JSON.stringify(hooks))
}

function parseURL(value: string) {
    if (!URL.canParse(value)) {
        throw new InvalidArgumentError('Malformed URL.');
    }
    return new URL(value);
}

program
    .name('Hooker')
    .description('Collects multiple URLs from config file and execute an http request on them')
    .version('0.0.1')
    .option('-c, --config <path>', 'Path of the config file', './config.json')
    .configureHelp({ showGlobalOptions: true })
    .hook('preAction', loadConfig)

program.command('list', { isDefault: true })
    .description('Lists the URLs to be called')
    .action((_, cmd) => {
        console.table(hooks.map(hook => {
            return {
                "name": hook.name,
                "verb": hook.verb.toString(),
                "url": hook.url.toString(),
            }
        }))
    })

const addProgram = program.command('add')
    .description('Adds an URL to the list')
    .argument('<url>', 'The URL to be called', parseURL)
    .argument('[name...]', 'A descriptive string fot the hook')
    .option('-h, --header <header...>', 'A request header with value format HEADERNAME:value')
    .hook('postAction', saveConfig)
    .action((url, name, options, cmd) => {
        let verb: HTTPVerb = new HTTPVerb(HTTPVerb.validHTTPVerbs[0])

        HTTPVerb.validHTTPVerbs.forEach(v => {
            v = v.toLowerCase()
            if (options[v]) {
                verb = new HTTPVerb(v)
            }
        })

        let hook: Hook = new Hook(url, verb, name.join(' '), options.header)
        hooks.push(hook)
    })

HTTPVerb.validHTTPVerbs.forEach((verb, index) => {
    let httpVerb = new HTTPVerb(verb)
    addProgram.addOption(
        new Option(
            '--' + verb.toLowerCase(),
            `Use HTTP verb ${httpVerb} for this call`
        )
            .conflicts(
                httpVerb.getVerbsConflicts().map((v) => {
                    return v.toLowerCase()
                })
            )
    )
})

program.command('del')
    .description('Removes all occurences of URL from the list')
    .argument('<url>', 'The URL to be removed', parseURL)
    .hook('postAction', saveConfig)
    .action((url) => {
        var indexesToBeRemoved: number[] = []

        hooks.forEach((hook, index) => {
            if (hook.url.toString() == url.toString()) {
                console.log(url.toString(), hook.url.toString(), index)
                indexesToBeRemoved.push(index)
            }
        })

        console.log(`removed ${indexesToBeRemoved.length} URLs`)

        hooks = hooks.filter((_, index) => { return indexesToBeRemoved.indexOf(index) == -1 })
    })

program.command('call')
    .requiredOption('url', 'The URL to be called', 'all')
    .option('-t, --test', 'dry run, does not call any URL', false)
    .option('-l, --log', 'log friendly output', false)
    .action((options, cmd) => {
        if (options.test) {
            hooks.forEach((hook, index) => {
                console.log(`[${index}] ${hook.name} (${hook.verb}) ${hook.url} - [\x1b[33mTEST\x1b[0m]`)
            })
        } else {
            var info: Array<any> = []

            Promise.all(
                hooks.map((hook, index) => {
                    return fetch(hook.url.toString(), {
                        method: hook.verb.toString(),
                        headers: {},
                        body: ''
                    }).then((data) => {
                        info[index] = {
                            "name": hook.name,
                            "verb": hook.verb.toString(),
                            "url": data.url.toString(),
                            "status": `[ \x1b[32m${data.statusText}\x1b[0m ]`,
                        }
                        if (options.log)
                            console.log(`${index} - ${hook.name} (${hook.verb}) ${data.url} - [ ${data.statusText} ]`)
                    }).catch((err) => {
                        info[index] = {
                            "name": hook.name,
                            "verb": hook.verb.toString(),
                            "url": hook.url.toString(),
                            "status": `[\x1b[31mFAIL\x1b[0m]`,
                        }
                        if (options.log) {
                            console.log(`${index} - ${hook.name} (${hook.verb}) ${hook.url} - [FAIL]`)
                            console.log(err)
                        }
                    })
                })
            ).then(() => {
                if (!options.log) console.table(info)
            })
        }
    })


program.parse(process.argv);
