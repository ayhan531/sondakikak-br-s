/* Son Dakika Kıbrıs — bildirim service worker'ı */

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Son Dakika Kıbrıs", body: event.data.text() };
  }

  const title = payload.title || "Son Dakika Kıbrıs";
  const options = {
    body: payload.body || "",
    icon: "/icon.png",
    badge: "/icon.png",
    image: payload.image || undefined,
    data: { url: payload.url || "/" },
    tag: payload.url || "sondakika",
    renotify: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url === url && "focus" in client) return client.focus();
      }
      return clients.openWindow(url);
    })
  );
});
