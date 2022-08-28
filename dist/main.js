#!/usr/bin/env node
"use strict";
/*
Copyright (c) <2022>, <Pedro Lucas Magalhães de Oliveira>
All rights reserved.

This source code is licensed under the BSD-style license found in the
LICENSE file in the root directory of this source tree.
 */
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
const commands_1 = require("./src/commands");
const pshell_1 = require("./src/pshell");
(_b = (_a = (0, pshell_1.decrypt)().stdout) === null || _a === void 0 ? void 0 : _a.on('data', (data) => {
    const svcs = JSON.parse(data);
    (0, commands_1.handleCommands)(svcs);
})) !== null && _b !== void 0 ? _b : false;
