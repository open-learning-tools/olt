(function () {
  "use strict";

  var config = window.OLT_SCHOLARSOME_XAPI || {};
  var ingestUrl = typeof config.ingestUrl === "string" ? config.ingestUrl.trim() : "";
  var activityPrefix =
    typeof config.activityPrefix === "string" ? config.activityPrefix.trim() : "";

  if (!ingestUrl) {
    return;
  }

  var routeKinds = [
    { kind: "study", pattern: /\/(study|review|learn)(\/|$)/i },
    { kind: "flashcards", pattern: /\/(flashcards?|decks?|sets?|cards?)(\/|$)/i }
  ];
  var lastStatementKey = "";

  function normalizedPrefix() {
    return (activityPrefix || window.location.origin).replace(/\/+$/, "");
  }

  function activityId(pathname) {
    var path = pathname.replace(/^\/+/, "");
    return normalizedPrefix() + "/scholarsome" + (path ? "/" + path : "/app");
  }

  function browserActor() {
    var key = "olt_scholarsome_xapi_actor";
    var actorId = "";

    try {
      actorId = window.localStorage.getItem(key) || "";
      if (!actorId) {
        actorId =
          "browser-" +
          Date.now().toString(36) +
          "-" +
          Math.random().toString(36).slice(2, 10);
        window.localStorage.setItem(key, actorId);
      }
    } catch (_error) {
      actorId = "browser-session";
    }

    return {
      objectType: "Agent",
      account: {
        homePage: window.location.origin,
        name: actorId
      }
    };
  }

  function classifyRoute(pathname) {
    for (var index = 0; index < routeKinds.length; index += 1) {
      if (routeKinds[index].pattern.test(pathname)) {
        return routeKinds[index].kind;
      }
    }

    return "app";
  }

  function buildStatement(reason) {
    var pathname = window.location.pathname || "/";
    var routeKind = classifyRoute(pathname);

    return {
      actor: browserActor(),
      verb: {
        id: "http://id.tincanapi.com/verb/viewed",
        display: { "en-US": "viewed" }
      },
      object: {
        id: activityId(pathname),
        definition: {
          name: { "en-US": routeKind === "app" ? "Scholarsome app" : "Scholarsome " + routeKind },
          type: "http://adlnet.gov/expapi/activities/module"
        },
        objectType: "Activity"
      },
      context: {
        platform: "Scholarsome",
        extensions: {
          "https://openlearningtools.local/xapi/extensions/route": pathname,
          "https://openlearningtools.local/xapi/extensions/event_reason": reason
        }
      },
      timestamp: new Date().toISOString()
    };
  }

  function postStatement(statement) {
    var body = JSON.stringify(statement);

    if (navigator.sendBeacon) {
      var blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon(ingestUrl, blob)) {
        return Promise.resolve();
      }
    }

    return fetch(ingestUrl, {
      method: "POST",
      mode: "cors",
      credentials: "omit",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: body
    }).then(function (response) {
      if (!response.ok) {
        throw new Error("Scholarsome xAPI forward failed: " + response.status);
      }
    });
  }

  function emit(reason) {
    var statement = buildStatement(reason);
    var statementKey = statement.object.id + "|" + reason;

    if (statementKey === lastStatementKey) {
      return;
    }

    lastStatementKey = statementKey;
    postStatement(statement).catch(function (error) {
      if (window.console && console.warn) {
        console.warn(error);
      }
    });
  }

  function wrapHistoryMethod(name) {
    var original = window.history[name];
    window.history[name] = function () {
      var result = original.apply(this, arguments);
      window.dispatchEvent(new Event("olt:locationchange"));
      return result;
    };
  }

  wrapHistoryMethod("pushState");
  wrapHistoryMethod("replaceState");
  window.addEventListener("popstate", function () {
    window.dispatchEvent(new Event("olt:locationchange"));
  });
  window.addEventListener("olt:locationchange", function () {
    emit("route_change");
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      emit("app_visit");
    });
  } else {
    emit("app_visit");
  }
})();
