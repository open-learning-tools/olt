// OLT local-dev CryptPad browser configuration.
//
// Keep this file secret-free. If you choose to set AppConfig.loginSalt,
// create a local untracked override before any real user accounts exist.

define(['/common/application_config_internal.js'], function (AppConfig) {
  AppConfig.surveyURL = '';
  AppConfig.minimumPasswordLength = 8;

  return AppConfig;
});
