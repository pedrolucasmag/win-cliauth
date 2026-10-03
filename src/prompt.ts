/*
Copyright (c) <2022>, <Pedro Lucas Magalhães de Oliveira>
All rights reserved.

This source code is licensed under the BSD-style license found in the
LICENSE file in the root directory of this source tree.
 */

async function readPiped(): Promise<string> {
  let data = '';
  for await (const chunk of process.stdin) data += chunk;
  return data.split(/\r?\n/)[0].trim();
}

/** Reads a secret without echoing it (or the first line of piped stdin). */
export function readSecret(prompt: string): Promise<string> {
  const { stdin, stderr } = process;
  if (!stdin.isTTY) return readPiped();
  return new Promise((resolve) => {
    let value = '';
    stderr.write(prompt);
    stdin.setRawMode(true);
    stdin.setEncoding('utf8');
    stdin.resume();
    const done = () => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.off('data', onData);
      stderr.write('\n');
    };
    const onData = (chunk: string) => {
      for (const ch of chunk) {
        if (ch === '\r' || ch === '\n') {
          done();
          return resolve(value.trim());
        }
        if (ch === '\u0003') {
          done();
          process.exit(130);
        }
        if (ch === '\u007f' || ch === '\b') value = value.slice(0, -1);
        else value += ch;
      }
    };
    stdin.on('data', onData);
  });
}
