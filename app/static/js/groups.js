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
  const groupClone = groupContainer
    .querySelector(".group:nth-last-child(2)")
    .cloneNode(true);

  groupClone.querySelector("h2").innerText = result.content.name;
  groupClone.querySelector("img").src = result.content.image;

  groupContainer.insertBefore(groupClone, groupContainer.lastElementChild);

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

  editGroupDialog.querySelector("input[name='id']").value = event.target.dataset.id;
  editGroupDialog.querySelector("input[name='user']").value = event.target.dataset.user;
  editGroupDialog.querySelector("input[name='name']").value = event.target.dataset.name;
  editGroupDialog.querySelector("img").src = event.target.dataset.icon;
  editGroupDialog.showModal();
}

function onEditGroupAbortClicked(event) {
  event.preventDefault();

  editGroupDialog.close();
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

function onCreateGroupAbortClicked(event) {
  event.preventDefault();

  createGroupDialog.querySelector("input[name='name']").value = "";
  createGroupDialog.querySelector("input[name='icon']").value = "";
  createGroupDialog.querySelector("#image-preview").src = "";
  createGroupDialog.close();
}
