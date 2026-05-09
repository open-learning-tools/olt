(function () {
  var config = window.OLT_XAPI_CONFIG || {};
  var ingestUrl = typeof config.ingestUrl === 'string' ? config.ingestUrl.trim() : '';
  var activityPrefix = typeof config.activityPrefix === 'string' ? config.activityPrefix.trim() : '';

  if (!ingestUrl || !activityPrefix || /(^|\.)cryptpad-sandbox\.localhost$/.test(window.location.hostname)) {
    return;
  }

  var normalizePrefix = function (value) {
    return value.replace(/\/+$/, '');
  };

  var getAppName = function () {
    var segment = window.location.pathname.split('/').filter(Boolean)[0];
    return segment || 'home';
  };

  var getActorId = function () {
    var key = 'olt.xapi.actorId';
    var fallback = 'cryptpad-demo-' + Math.random().toString(36).slice(2);

    try {
      var existing = window.localStorage.getItem(key);
      if (existing) {
        return existing;
      }

      if (window.crypto && typeof window.crypto.randomUUID === 'function') {
        fallback = 'cryptpad-demo-' + window.crypto.randomUUID();
      }

      window.localStorage.setItem(key, fallback);
    } catch (error) {
      return fallback;
    }

    return fallback;
  };

  var appName = getAppName();
  var activityId = normalizePrefix(activityPrefix) + '/cryptpad/' + encodeURIComponent(appName);
  var actorId = getActorId();
  var statement = {
    actor: {
      account: {
        homePage: window.location.origin,
        name: actorId,
      },
    },
    verb: {
      id: 'http://id.tincanapi.com/verb/viewed',
      display: {
        'en-US': 'viewed',
      },
    },
    object: {
      id: activityId,
      definition: {
        name: {
          'en-US': 'CryptPad ' + appName,
        },
        type: 'http://adlnet.gov/expapi/activities/module',
      },
      objectType: 'Activity',
    },
    context: {
      platform: 'Open Learning Tools Docs',
      extensions: {
        'https://openlearningtools.org/xapi/extensions/service': 'cryptpad',
        'https://openlearningtools.org/xapi/extensions/app': appName,
        'https://openlearningtools.org/xapi/extensions/path': window.location.pathname,
      },
    },
    timestamp: new Date().toISOString(),
  };
  var body = JSON.stringify(statement);

  if (window.fetch) {
    window.fetch(ingestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Experience-API-Version': '1.0.3',
      },
      body: body,
      credentials: 'omit',
      keepalive: true,
    }).catch(function () {
      // Activity reporting is best effort and must not affect Docs usage.
    });
    return;
  }

  if (navigator.sendBeacon) {
    navigator.sendBeacon(ingestUrl, new Blob([body], { type: 'application/json' }));
  }
}());
