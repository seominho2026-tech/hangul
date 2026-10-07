import {spawnSync} from 'node:child_process';
const r=spawnSync('git',['credential','fill'],{input:'protocol=https\nhost=github.com\n\n',encoding:'utf8'});if(r.status!==0)throw Error('Git authentication unavailable');
const fields=Object.fromEntries(r.stdout.trim().split('\n').map(l=>{const i=l.indexOf('=');return [l.slice(0,i),l.slice(i+1)]}));
const response=await fetch('https://api.github.com/repos/seominho2026-tech/hangul/pages/builds',{method:'POST',headers:{Authorization:`Bearer ${fields.password}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'}});
console.log(JSON.stringify({status:response.status,body:await response.json()}));
