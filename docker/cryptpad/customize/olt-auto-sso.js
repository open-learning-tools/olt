(function () {
  var params = new URLSearchParams(window.location.search);
  if (params.get('olt_auto_sso') !== '1') {
    return;
  }

  var started = false;
  var attempts = 0;
  var maxAttempts = 100;

  var findSsoButton = function () {
    return Array.prototype.find.call(document.querySelectorAll('button'), function (button) {
      return button.textContent && button.textContent.trim() === 'Open Learning Tools';
    });
  };

  var startSso = function () {
    if (started || attempts >= maxAttempts) {
      window.clearInterval(timer);
      return;
    }

    attempts += 1;
    var button = findSsoButton();
    if (!button || button.disabled) {
      return;
    }

    started = true;
    window.clearInterval(timer);
    button.click();
  };

  var timer = window.setInterval(startSso, 100);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startSso);
  } else {
    startSso();
  }
}());
