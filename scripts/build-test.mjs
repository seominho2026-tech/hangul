import { spawnSync } from 'node:child_process';
for(const args of [['node_modules/typescript/bin/tsc'],['node_modules/vite/bin/vite.js','build','--outDir','dist-test']]){
 const result=spawnSync(process.execPath,args,{stdio:'inherit',env:{...process.env,VITE_TEST_MODE:'true'}});if(result.status)process.exit(result.status);
}
