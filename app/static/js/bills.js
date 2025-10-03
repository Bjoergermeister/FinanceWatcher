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
    sendNotification(
      "Löschen fehlgeschlagen",
      `Die Ausgabe konnte nicht gelöscht werden: ${result.errors}`,
      NOTIFICATION_TYPE_ERROR
    )
    return;
  }

  event.target.classList.remove("loading");

  const row = document.querySelector(`tr[data-id='${billId}'`);
  row.remove();

  confirmBillDeletionDialog.close();
}

async function onBillPreviewClicked(event) {
  event.preventDefault();

  const billId = event.currentTarget.dataset.id;
  const billName = event.currentTarget.dataset.name;
  const result = await BillAPI.preview(billId);
  if (result.success === false) {
    sendNotification(
      "Vorschau fehlgeschlagen",
      `Die Vorschau der Ausgabe konnte nicht angezeigt werden: ${result.errors}`,
      NOTIFICATION_TYPE_ERROR
    );
    return;
  }

  const billPreviewContainer = document.getElementById("bill-preview");
  billPreviewContainer.innerHTML = result.content;

  const billPreviewDialog = document.getElementById("bill-preview-dialog");
  billPreviewDialog.querySelector("#preview-bill-name").innerText = billName;
  billPreviewDialog.showModal();
}

async function onCloseBillPreviewClicked(event) {
  event.preventDefault();
  const dialog = document.getElementById("bill-preview-dialog");
  dialog.close();
}
