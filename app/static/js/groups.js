/******************/
/* EVENT HANDLERS */
/******************/

const createGroupDialog = document.getElementById("create-group-dialog");
const editGroupDialog = document.getElementById("edit-group-dialog");
const deleteGroupDialog = document.getElementById("confirm-group-deletion-dialog");
const addUserGroupButton = document.getElementById("add-user-group-button");
const addGlobalGroupButton = document.getElementById("add-global-group-button");

let groupId = undefined;

async function onGroupFormSubmitted(event) {
  event.preventDefault();

  const data = new FormData(event.target);
  const id = data.get("id");

  const result =
    id === null || id === ""
      ? await GroupAPI.create(data)
      : await GroupAPI.edit(id, data);

  if (result.success == false) {
    alert("Something went wrong");
    console.log(result.content);
    return;
  }

  const isGlobalGroupInput = createGroupDialog.querySelector("input[name='is_global']");
  const isGlobalGroup = isGlobalGroupInput.value === "true";

  const groupContainerSelector = isGlobalGroup ? "global-groups" : "user-groups";
  const groupContainer = document.getElementById(groupContainerSelector);

  const newGroup = createNewGroup(result.content);
  groupContainer.insertBefore(newGroup, groupContainer.lastElementChild);

  createGroupDialog.close();
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
    alert("Failure");
    return;
  }

  event.target.classList.remove("loading");

  const group = document.querySelector(`div[data-id="${groupId}"]`);
  group.remove();

  deleteGroupDialog.close();
}

function onDeleteGroupAborted(event) {
  event.preventDefault();
  groupId = undefined;

  deleteGroupDialog.close();
}

function onEditGroupClicked(event) {
  event.preventDefault();

  const button = event.target;
  const isGlobalGroup = button.dataset.user === undefined;

  if (isGlobalGroup) {
    editGroupDialog.querySelector("input[name='is_global']").value = true;
    editGroupDialog.querySelector("input[name='user']").value = event.target.dataset.user;
  } else {
    editGroupDialog.querySelector("input[name='is_global']").value = false;
  }

  editGroupDialog.querySelector("input[name='id']").value = event.target.dataset.id;
  editGroupDialog.querySelector("input[name='name']").value = event.target.dataset.name;
  editGroupDialog.querySelector("#image-preview").src = event.target.dataset.icon;
  editGroupDialog.showModal();
}

function onAddGlobalGroupClicked(event) {
  event.preventDefault();

  createGroupDialog.querySelector("input[name='is_global']").value = true;
  createGroupDialog.showModal();
}

function onAddUserGroupClicked(event) {
  event.preventDefault();

  createGroupDialog.querySelector("input[name='is_global']").value = false;
  createGroupDialog.showModal();
}

function onGroupImageChanged(event) {
  event.preventDefault();

  if (event.target.files.length === 0) return;

  const preview = document.getElementById("image-preview");
  preview.src = URL.createObjectURL(event.target.files[0]);
}

function onGroupAbortClicked(event) {
  event.preventDefault();

  const dialog = findParentElement(event.target, "DIALOG");

  dialog.querySelector("input[name='name']").value = "";
  dialog.querySelector("input[name='icon']").value = "";
  dialog.querySelector("#image-preview").src = "";
  dialog.close();
}

/********************/
/* HELPER FUNCTIONS */
/********************/

/**
 *
 * @param {Object} newInstance - An object representing the group
 * @returns {HTMLElement} - The new group element
 */
function createNewGroup(newGroupInstance) {
  const groupClone = document.getElementById("group-template").content.cloneNode(true)
    .children[0];

  groupClone.querySelector("h2").innerText = newGroupInstance.name;
  groupClone.querySelector("img").src = newGroupInstance.image;
  groupClone.dataset.id = newGroupInstance.id;

  const editGroupButton = groupClone.querySelector("button.btn-primary");
  editGroupButton.dataset.id = newGroupInstance.id;
  editGroupButton.dataset.icon = newGroupInstance.image;
  editGroupButton.dataset.name = newGroupInstance.name;

  if (newGroupInstance.user !== undefined) {
    editGroupButton.dataset.user = newGroupInstance.user;
  }

  const deleteGroupButton = groupClone.querySelector("button.btn-danger");
  deleteGroupButton.dataset.id = newGroupInstance.id;

  return groupClone;
}
