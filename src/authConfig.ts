import { Configuration, PopupRequest } from '@azure/msal-browser';

export const msalConfig: Configuration = {
  auth: {
    clientId: '1ed48382-20a5-46a5-9c5d-297c27f7b11b', // Replace with your actual client ID
    authority: 'https://login.microsoftonline.com/common',
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
};

export const loginRequest: PopupRequest = {
  scopes: [
    'User.Read',
    'Files.ReadWrite',
    'Mail.Read',
  ],
};