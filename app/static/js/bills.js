const confirmBillDeletionDialog = document.getElementById("confirm-bill-deletion-dialog");
let billId = undefined;

function onDeleteBillClicked(event) {
  event.preventDefault();
  billId = event.target.dataset.id;
  confirmBillDeletionDialog.showModal();
}

function onBillDeletionAbortClicked(event) {
  event.preventDefault();
  billId = undefined;
  confirmBillDeletionDialog.close();
}

async function onBillDeletionConfirmClicked(event) {
  event.preventDefault();

  event.target.classList.add("loading");
  const result = await BillAPI.delete(billId);
  if (result.success === false) {
    alert(`Failure`);
  }

  event.target.classList.remove("loading");

  const row = document.querySelector(`tr[data-id='${billId}'`);
  row.remove();

  confirmBillDeletionDialog.close();
}
