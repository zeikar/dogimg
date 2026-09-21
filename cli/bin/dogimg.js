#!/usr/bin/env node
import { run } from "../run.js";

process.exitCode = await run(process.argv.slice(2));
