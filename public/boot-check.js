/**
 * Boot watchdog.
 *
 * If the app bundle never downloads or throws before React mounts, the page
 * would otherwise sit on a spinner forever. After 20 seconds we swap in a
 * readable message instead of a blank screen.
 *
 * Lives in its own file rather than inline in index.html so the page can run
 * under a Content-Security-Policy without `script-src 'unsafe-inline'`.
 */
(function () {
  setTimeout(function () {
    var fallback = document.getElementById("boot-fallback");
    if (!fallback) return; // React mounted and replaced the container.

    var spinner = document.getElementById("boot-spinner");
    if (spinner) spinner.style.display = "none";

    var message = document.getElementById("boot-message");
    if (!message) return;

    message.textContent = "";

    var heading = document.createElement("div");
    heading.style.cssText =
      "color:#0f172a;font-size:18px;font-weight:600;margin-bottom:10px";
    heading.textContent = "We could not load the page";

    var detail = document.createElement("div");
    detail.style.cssText = "color:#475569;line-height:1.6;margin-bottom:18px";
    detail.textContent =
      "This is usually a connection problem. Please check your internet and reload.";

    var button = document.createElement("button");
    button.type = "button";
    button.style.cssText =
      "border:0;border-radius:999px;background:#0f172a;color:#fff;padding:10px 22px;font-size:14px;cursor:pointer";
    button.textContent = "Reload page";
    button.addEventListener("click", function () {
      window.location.reload();
    });

    message.appendChild(heading);
    message.appendChild(detail);
    message.appendChild(button);
  }, 20000);
})();
