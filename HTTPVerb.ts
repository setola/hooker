import { InvalidArgumentError } from "commander";

export class HTTPVerb {
    verb: string;
    static readonly validHTTPVerbs = ['GET', 'POST', 'HEAD', 'PUT', 'DELETE', 'CONNECT', 'OPTIONS', 'TRACE', 'PATCH'];

    constructor(verb: string) {
        this.verb = this.validate(verb)
    }

    protected validate(verb: string) {
        verb = verb.toUpperCase()
        if (HTTPVerb.validHTTPVerbs.indexOf(verb) == -1) {
            throw new InvalidArgumentError('Is not a valid HTTP verb');
        }
        return verb;
    }

    getVerbsConflicts(): string[] {
        return HTTPVerb.validHTTPVerbs.filter((v) => { return v != this.verb });
    }

    toString(): string {
        return this.verb
    }

    toJSON(): string {
        return this.verb
    }
}