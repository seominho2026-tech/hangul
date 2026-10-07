import { defineConfig, devices } from '@playwright/test';
export default defineConfig({testDir:'./tests',testMatch:'festival.spec.ts',workers:1,timeout:300000,expect:{timeout:10000},use:{baseURL:'http://127.0.0.1:4188',channel:'chrome',trace:'off',screenshot:'only-on-failure'},projects:[{name:'desktop',use:{...devices['Desktop Chrome'],channel:'chrome',viewport:{width:1440,height:900}}},{name:'mobile',use:{...devices['iPhone 13'],defaultBrowserType:'chromium',channel:'chrome'}}]});

