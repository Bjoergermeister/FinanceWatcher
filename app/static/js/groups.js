/******************/
/* EVENT HANDLERS */
/******************/

const groupDialog = document.getElementById("group-dialog");
const deleteGroupDialog = document.getElementById("confirm-group-deletion-dialog");
const addGroupButton = document.getElementById("add-group-button");

let groupId = undefined;

async function onGroupFormSubmitted(event) {
  event.preventDefault();

  const form = event.target;
  const data = new FormData(form);
  const id = data.get("id");

  const isCreating = id === null || id === "";

  removeFormErrors(form);

  const result = isCreating 
    ? await GroupAPI.create(data) 
    : await GroupAPI.edit(id, data);

  if (result.success == false) {
    if (result.errors instanceof Object){
      displayFormErrors(form, result.errors["form"]);
    }
    const errorMessageTitle = isCreating 
      ? "Erstellen der Gruppe fehlgeschlagen" 
      : "Bearbeiten der Gruppe fehlgeschlagen";
    const errorMessage = (typeof result.errors === "string") ? result.errors : "Die Gruppe konnte nicht gespeichert werden";

    sendNotification(errorMessageTitle, errorMessage, NOTIFICATION_TYPE_ERROR);
    return;
  }

  // If a new group was created, we need to create an HTML element for it and add it to the user groups container
  // Otherwise (if a group was edited) we need to update its HTML element so display the changes (if any)
  if (isCreating) {
    const groupContainer = document.getElementById("user-groups");
    const newGroup = createNewGroup(result.content);
    groupContainer.insertBefore(newGroup, groupContainer.lastElementChild);
  } else {
    const id = result.content.id;
    const formRow = document.querySelector(`div.group[data-id='${id}']`);
    formRow.querySelector("img").src = `${result.content.icon}#${Date.now()}`;
    formRow.querySelector("h2").innerText = result.content.name;

    const editButton = formRow.querySelectorAll("button")[1];
    editButton.dataset.icon = result.content.icon;
    editButton.dataset.name = result.content.name;
  }

  groupDialog.close();

  const notificationTitle = isCreating ? "Gruppe erstellt" : "Gruppe bearbeitet";
  const notificationMessage = isCreating 
    ? "Die Gruppe wurde erfolgreich erstellt." 
    : "Die Gruppe wurde erfolgreich bearbeitet.";
  sendNotification(
    notificationTitle,
    notificationMessage,
    NOTIFICATION_TYPE_SUCCESS
  );
}

async function onDeleteGroupClicked(event) {
  event.preventDefault();

  groupId = event.target.dataset.id;
  deleteGroupDialog.showModal();
}

async function onDeleteGroupConfirmed(event) {
  event.preventDefault();

  event.target.classList.add("loading");
  const result = await GroupAPI.delete(groupId);
  if (result.success === false) {
    sendNotification(
      "Löschen der Gruppe fehlgeschlagen",
      result.errors,
      NOTIFICATION_TYPE_ERROR
    );
    return;
  }

  event.target.classList.remove("loading");

  const group = document.querySelector(`div[data-id="${groupId}"]`);
  group.remove();

  deleteGroupDialog.close();

  sendNotification(
    "Gruppe gelöscht",
    "Die Gruppe wurde erfolgreich gelöscht.",
    NOTIFICATION_TYPE_SUCCESS
  );
}

function onDeleteGroupAborted(event) {
  event.preventDefault();
  groupId = undefined;

  deleteGroupDialog.close();
}

function onAddGroupClicked(event) {
  event.preventDefault();
  groupDialog.showModal();
}

function onEditGroupClicked(event) {
  event.preventDefault();

  groupDialog.querySelector("input[name='id']").value = event.target.dataset.id;
  groupDialog.querySelector("input[name='name']").value = event.target.dataset.name;
  groupDialog.querySelector("input[name='icon']").required = false;
  groupDialog.querySelector(".image-preview").src = event.target.dataset.icon;
  groupDialog.showModal();
}

function onGroupImageChanged(event) {
  event.preventDefault();

  if (event.target.files.length === 0) return;

  const form = findParentElement(event.target, "FORM");
  const imagePreview = form.querySelector(".image-preview");
  imagePreview.src = URL.createObjectURL(event.target.files[0]);
}

function onGroupAbortClicked(event) {
  event.preventDefault();

  const dialog = findParentElement(event.target, "DIALOG");
  if (dialog === null) return;

  dialog.querySelector("input[name='name']").value = "";
  dialog.querySelector("input[name='icon']").value = "";
  dialog.querySelector(".image-preview").removeAttribute("src");
  dialog.close();
}

/********************/
/* HELPER FUNCTIONS */
/********************/

/**
 *
 * @param {Object} newGroupInstance - An object representing the group
 * @returns {HTMLElement} - The new group element
 */
function createNewGroup(newGroupInstance) {
  const groupClone = document
    .getElementById("group-template")
    .content
    .cloneNode(true)
    .children[0];

  groupClone.querySelector("h2").innerText = newGroupInstance.name;
  groupClone.querySelector("img").src = newGroupInstance.icon;
  groupClone.dataset.id = newGroupInstance.id;

  const editGroupButton = groupClone.querySelector("button.btn-primary");
  editGroupButton.dataset.id = newGroupInstance.id;
  editGroupButton.dataset.icon = newGroupInstance.icon;
  editGroupButton.dataset.name = newGroupInstance.name;

  const deleteGroupButton = groupClone.querySelector("button.btn-danger");
  deleteGroupButton.dataset.id = newGroupInstance.id;

  return groupClone;
}
