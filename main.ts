#!/usr/bin/env node

/* 
Copyright (c) <2022>, <Pedro Lucas Magalhães de Oliveira>
All rights reserved.

This source code is licensed under the BSD-style license found in the
LICENSE file in the root directory of this source tree. 
 */


import { handleCommands } from './src/commands';
import { decrypt } from './src/pshell';

  decrypt().stdout?.on('data', (data) => {
    const svcs = JSON.parse(data);
    handleCommands(svcs);
  }) ?? false;