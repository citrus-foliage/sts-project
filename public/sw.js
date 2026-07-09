// Student Life Manager — Push Notification Service Worker

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = { title: "New notification", body: event.data.text() };
  }

  const { title, body, link, icon } = data;

  event.waitUntil(
    self.registration.showNotification(title ?? "Student Life Manager", {
      body: body ?? "",
      icon: icon ?? "/icons/icon-192.png",
      badge: "/icons/badge-72.png",
      data: { link: link ?? "/" },
      vibrate: [200, 100, 200],
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const link = event.notification.data?.link ?? "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // If app is already open, focus it and navigate
        for (const client of clientList) {
          if (client.url && "focus" in client) {
            client.focus();
            client.postMessage({ type: "navigate", link });
            return;
          }
        }
        // Otherwise open a new window
        if (clients.openWindow) {
          return clients.openWindow(link);
        }
      }),
  );
});
