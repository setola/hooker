import { URL } from 'url';
import { HTTPVerb } from './HTTPVerb';

export class Hook {
    url: URL
    verb: HTTPVerb
    name: string
    headers: string[]

    constructor(url: URL, verb: HTTPVerb, name: string='unnamed', headers: string[]=[]) {
        this.url = url
        this.verb = verb
        this.name = name
        this.headers = headers
    }

    static parseFromJSON(json: any): Hook {
        return new Hook(
            new URL(json.url),
            new HTTPVerb(json.verb),
            json.name
        )
    }
}