setupCallbacks.push(() => {
  sendNotification("Test", "test", NOTIFICATION_TYPE_SUCCESS);
});

const notifications = new Map();
const storedNotifications = [];
const notificationBell = document.getElementById("notification-bell");
const notificationContainer = document.getElementById("notifications");

const NOTIFICATION_TYPE_ERROR = "alert-danger";
const NOTIFICATION_TYPE_SUCCESS = "alert-success";
const NOTIFICATION_TYPE_INFORMATION = "alert-primary";

function moveNotifications() {
  // Sadly, the timeout is necesarry because otherwise the animation does not work.
  // Apparently the code is run before the element is drawn for the first time, which means it doesn't have a translation yet
  // and the animation doesn't run.
  setTimeout(() => {
    const currentNotifications = notificationContainer.querySelectorAll(".notification");
    for (let i = 0; i < currentNotifications.length; i++) {
      const notification = currentNotifications[i];
      notification.style.translate = `0px calc(100vh - (100% + 10px) * ${
        currentNotifications.length - i
      })`;
    }
  }, 500);
}

/**
 * Shows a notification to the user
 * @param {string} title - The title of the notification
 * @param {string} text - The message that should be displayed to the user
 * @param {string} type - The type of the notifcation (one of NOTIFICATION_TYPE_SUCCESS, NOTIFICATION_TYPE_ERROR, NOTIFICATION_TYPE_INFORMATION)
 */
function sendNotification(title, text, type) {
  const [newNotification, id] = createNotification(title, text, type);

  if (notificationContainer.childElementCount == 0) {
    notificationContainer.showPopover();
  }
  notificationContainer.appendChild(newNotification);

  moveNotifications();

  const removeTimeout = setTimeout(() => {
    newNotification.remove();
    if (notificationContainer.childElementCount == 0) {
      notificationContainer.hidePopover();
    }

    // Push notification to drawer and increase count
    storedNotifications.push(newNotification);

    const currentNotificationCount = parseInt(notificationBell.dataset.count);
    notificationBell.dataset.count = currentNotificationCount + 1;
  }, 5000);

  notifications[id] = removeTimeout;
}

function createNotification(title, text, type) {
  const notification = document.createElement("div");
  notification.classList.add("notification", "alert", type);
  notification.innerHTML = `
        <header><h4 class="alert-heading">${title}</h4><i class="fa fa-lg fa-close"></i></header>
        <p>${text}</p>
    `;
  notification.style.translate = "0px calc(100vh)";
  notification
    .querySelector("header i")
    .addEventListener("click", onCloseNotificationClicked);
  notification.addEventListener("mouseenter", onMouseEnterNotification);
  notification.addEventListener("mouseleave", onMouseLeaveNotification);

  // Generate an ID for the notification so timeout can be tracked properly.
  // This doesn't really prevent id collissions, but since there will be rarely more than one notification at a time, it's okay
  const id = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
  notification.dataset.id = id;

  return [notification, id];
}

// **********************
// *   EVENT HANDLERS   *
// **********************

function onCloseNotificationClicked(event) {
  event.preventDefault();

  const notification = event.target.parentElement.parentElement;
  const id = notification.dataset.id;
  clearTimeout(notifications[id]);
  notification.remove();
}

function onMouseEnterNotification(event) {
  const id = event.target.dataset.id;
  clearTimeout(notifications[id]);
}

function onMouseLeaveNotification(event) {
  const id = event.target.dataset.id;
  const removeTimeout = setTimeout(() => {
    event.target.remove();
  }, 5000);
  notifications[id] = removeTimeout;
}

function onNotificationBellClicked(event) {
  event.preventDefault();

  const currentNotifications = notificationContainer.querySelectorAll(".notification");
  for (let i = 0; i < currentNotifications.length; i++) {
    const notification = currentNotifications[i];
    notification.style.translate = `0px calc(100vh - (100% + 10px) * ${
      currentNotifications.length - i
    })`;
  }
}
