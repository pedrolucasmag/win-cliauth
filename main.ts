#!/usr/bin/env node

/*
Copyright (c) <2022>, <Pedro Lucas Magalhães de Oliveira>
All rights reserved.

This source code is licensed under the BSD-style license found in the
LICENSE file in the root directory of this source tree.
 */


import { handleCommands } from './src/commands';
import { notifyUpdate } from './src/update';

handleCommands()
  .catch((error) => {
    console.error(`Error: ${error instanceof Error ? error.message : error}`);
    process.exitCode = 1;
  })
  .then(notifyUpdate);
