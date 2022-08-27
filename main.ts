import { handleCommands } from './src/commands';
import { decrypt } from './src/pshell';

  decrypt().stdout?.on('data', (data) => {
    const svcs = JSON.parse(data);
    handleCommands(svcs);
  }) ?? false;