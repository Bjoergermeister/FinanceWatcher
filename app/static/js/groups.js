/******************/
/* EVENT HANDLERS */
/******************/

const deleteGroupDialog = document.getElementById("confirm-group-deletion-dialog");

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

  const row = document.querySelector(`tr[data-id="${groupId}"]`);
  row.remove();

  deleteGroupDialog.close();
}

function onDeleteGroupAborted(event) {
  event.preventDefault();
  groupId = undefined;

  deleteGroupDialog.close();
}
