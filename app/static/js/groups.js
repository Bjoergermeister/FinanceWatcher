/******************/
/* EVENT HANDLERS */
/******************/

const deleteGroupDialog = document.getElementById("confirm-group-deletion-dialog");
const editGroupDialog = document.getElementById("edit-group-dialog");

let groupId = undefined;

async function onCreateGroupFormSubmitted(event) {
  event.preventDefault();

  const data = new FormData(event.target);
  const result = await GroupAPI.create(data);
  console.log(result);
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

async function onEditGroupFormSubmitted(event) {
  event.preventDefault();

  const data = new FormData(event.target);
  const id = data.get("id");

  const result = await GroupAPI.edit(id, data);
  if (result.success == false) {
    alert("Problem");
    return;
  }

  alert("Saving");
  editGroupDialog.close();
}
