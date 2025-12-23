import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ivanshyla.knowingyou',
  appName: 'Knowing You',
  webDir: 'out',
  server: {
    url: 'https://knowing-you-prod.eu-north-1.elasticbeanstalk.com',
    allowNavigation: ['knowing-you-prod.eu-north-1.elasticbeanstalk.com']
  }
};

export default config;
