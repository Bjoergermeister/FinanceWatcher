/******************/
/* EVENT HANDLERS */
/******************/

const deleteGroupDialog = document.getElementById("confirm-group-deletion-dialog");

async function onCreateGroupFormSubmitted(event) {
  event.preventDefault();

  const data = new FormData(event.target);
  const result = await GroupAPI.create(data);
  console.log(result);
}

async function onDeleteGroupClicked(event) {
  event.preventDefault();

  deleteGroupDialog.showModal();
}
