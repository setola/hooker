# hooker

A simple commmand line tool for calling web hooks inside deployment pipelines.

Use add list del sub-command to manage your list of hooks, or provide a configuration json, then use call to fetch all urls.

Run me inside docker by adding an alias on the prompt inside the project directory
```bash
alias hooker="docker run --rm -ti -v ${PWD}:/app -w /app oven/bun:debian --bun index.ts"
```
and then you can use
```bash
hooker help
```


To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts help
```

This project was created using `bun init` in bun v1.1.34. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
