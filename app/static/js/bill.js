const prices = [];
const quantities = [];

const chooseGroupDialog = document.getElementById("choose-group-dialog");
const positionNoteDialog = document.getElementById("position-note-dialog");
const positionNote = document.getElementById("bill-position-note");

const groupTemplate = document.getElementById("group-template");
const positionGroupTemplate = document.getElementById("position-group-template");

const confirmPositionDeletionDialog = document.getElementById(
  "confirm-position-deletion-dialog"
);

const totalFormsInput = document.getElementById("id_position-TOTAL_FORMS");

let positionToDelete = null;

(function registerEventListeners() {
  const priceInputs = document.querySelectorAll("#bill-form input[name$='price']");
  const quantityInputs = document.querySelectorAll("#bill-form input[name$='quantity']");

  for (const priceInput of priceInputs) {
    priceInput.addEventListener("change", onPositionPriceChanged);
    prices.push(parseFloat(priceInput.value));
  }

  for (const quantityInput of quantityInputs) {
    quantityInput.addEventListener("change", onPositionQuantityChanged);
    quantities.push(parseFloat(quantityInput.value));
  }
})();

/******************/
/* Event handlers */
/******************/

function onPositionPriceChanged(event) {
  const index = parseInt(event.target.name.split("-")[1]);
  prices[index] = event.target.value;
  calculateBillTotal();
}

function onPositionQuantityChanged(event) {
  const index = parseInt(event.target.name.split("-")[1]);
  quantities[index] = event.target.value;
  calculateBillTotal();
}

function onPositionNoteClicked(event) {
  const index = parseInt(event.target.dataset.index);
  const currentPositionNote = document.querySelector(
    `#bill-positions .form-row:nth-child(${index + 1}) input[name$='note']` // + 1 because the header row is also a form row
  );

  positionNote.dataset.index = index;
  positionNote.value = currentPositionNote.value;

  positionNoteDialog.showModal();
}

function onPositionNoteSaveClicked(event) {
  const index = parseInt(positionNote.dataset.index) + 1; // + 1 because the header row is also a form row
  const selector = `#bill-positions .form-row:nth-child(${index}) input[name$='note']`;
  const noteInput = document.querySelector(selector);

  noteInput.value = positionNote.value;
  positionNote.value = "";

  positionNoteDialog.close();
}

function onPositionNoteAbortClicked(event) {
  positionNote.value = "";
  positionNoteDialog.close();
}

async function onCreateBillFormSubmitted(event) {
  event.preventDefault();

  const form = event.target;
  const formRows = form.querySelectorAll(".form-row.position");
  updateFormRowIndices(formRows);

  const data = new FormData(event.target);
  const result = await BillAPI.create(data);

  alert(result.success);

  return false;
}

async function onEditBillFormSubmitted(event) {
  event.preventDefault();

  const data = new FormData(event.target);
  const result = await BillAPI.edit(BILL_ID, data);

  alert(result.success);

  return false;
}

async function onDeletePositionClicked(event) {
  event.preventDefault();

  // There must be at least one form row at all times.
  const totalFormsInput = document.querySelector(
    "#bill-positions input[name='position-TOTAL_FORMS']"
  );
  if (parseInt(totalFormsInput.value) == 1) return;

  positionToDelete = event.target.parentElement.parentElement;
  const idInput = positionToDelete.querySelector("input[name$='id']");

  // If the id input has a value, the position is saved in the database. Deleting it will also delete the database entry.
  // In this case, display a dialog which ask the user for confirmation
  if (idInput.value !== "") {
    confirmPositionDeletionDialog.dataset.id = event.target.dataset.id;
    confirmPositionDeletionDialog.showModal();
    return;
  }

  deletePosition();
}

function onNewPositionClicked(event) {
  event.preventDefault();

  const formRowContainer = event.target.parentElement; // This will be the div#bill-positions
  const formRows = formRowContainer.querySelectorAll(".form-row:not(:first-of-type)");

  // Copy last form row and clear inputs
  const formRowCopy = formRows[formRows.length - 1].cloneNode(true);

  cloneFormRow(formRowCopy, formRows.length, {
    price: 0.0,
    quantity: 1.0,
  });

  const priceInput = formRowCopy.querySelector("input[name$='price']");
  priceInput.addEventListener("change", onPositionPriceChanged);
  prices.push(priceInput.value);

  const quantityInput = formRowCopy.querySelector("input[name$='quantity']");
  quantityInput.addEventListener("change", onPositionPriceChanged);
  quantities.push(quantityInput.value);

  formRows[formRows.length - 1].after(formRowCopy);

  totalFormsInput.value = parseInt(totalFormsInput.value) + 1;

  // Check if the position is part of a group. If so, set the group ID
  formRowCopy.querySelector("input[name$='group']").value =
    event.target.parentElement.dataset.groupid;
}

function onPositionDeletionAbortClicked(event) {
  event.preventDefault();
  confirmPositionDeletionDialog.close();
}

async function onPositionDeletionConfirmClicked(event) {
  event.preventDefault();
  event.target.classList.add("loading");

  const positionId = confirmPositionDeletionDialog.dataset.id;
  const result = await BillAPI.deletePosition(BILL_ID, positionId);
  if (result.success === false) {
    return;
  }

  event.target.classList.remove("loading");
  confirmPositionDeletionDialog.close();
  deletePosition();
}

async function onNewGroupButtonClicked(event) {
  event.preventDefault();

  chooseGroupDialog.showModal();

  const result = await GroupAPI.getAll();
  if (result.success === false) {
    alert("Failure");
  }

  const userGroupList = document.getElementById("user-group-list");
  for (const userGroup of result.content.user_groups) {
    const groupElement = createGroupElement(userGroup);
    userGroupList.appendChild(groupElement);
  }

  const globalGroupList = document.getElementById("global-group-list");
  for (const globalGroup of result.content.global_groups) {
    const groupElement = createGroupElement(globalGroup);
    globalGroupList.appendChild(groupElement);
  }

  console.log(result.content);
}

function onGroupSelected(event) {
  event.preventDefault();

  // Copy group from template, fill with values and insert into DOM
  const addGroupButton = document.getElementById("add-group-button");
  const group = positionGroupTemplate.content.cloneNode(true);
  group.querySelector("img").src = `/media/${event.target.dataset.icon}`;
  group.querySelector("h2").innerText = event.target.dataset.name;

  // Clone, reset and insert a form row
  const formRowCopy = document
    .querySelector("#bill-form fieldset:nth-of-type(2) .form-row:nth-of-type(2)")
    .cloneNode(true);
  const fieldset = group.children[0];
  fieldset.dataset.groupid = event.target.dataset.id;
  fieldset.insertBefore(formRowCopy, fieldset.children[fieldset.children.length - 1]);
  fieldset.querySelector("input[name$='group']").value = event.target.dataset.id;

  const container = document.getElementById("bill-form");
  container.insertBefore(group, addGroupButton.parentElement);

  totalFormsInput.value = parseInt(totalFormsInput.value) + 1;

  chooseGroupDialog.close();
}

/********************/
/* Helper Functions */
/********************/
function createGroupElement(group) {
  const container = groupTemplate.content.cloneNode(true);
  container.children[0].dataset.id = group.id;
  container.children[0].dataset.name = group.name;
  container.children[0].dataset.icon = group.icon;

  const image = container.querySelector("img");
  image.src = `/media/${group.icon}`;
  image.alt = `${group.name} Logo`;

  container.querySelector("h2").innerText = group.name;

  return container;
}

function calculateBillTotal() {
  let total = 0;
  for (let i = 0; i < prices.length; i++) {
    total += prices[i] * quantities[i];
  }

  const totalDisplaySpan = document.getElementById("bill-sum");
  totalDisplaySpan.innerText = `${total.toFixed(2)} €`;
  document.querySelector("#bill-form input[name$='total']").value = total.toFixed(2);
}

function removePositionFromTotal(formRow) {
  const price = parseFloat(formRow.querySelector("input[name$='price'").value);
  const quantity = parseFloat(formRow.querySelector("input[name$='quantity']").value);

  for (let i = 0; i < prices.length; i++) {
    if (prices[i] === price && quantities[i] == quantity) {
      prices.splice(i, 1);
      quantities.splice(i, 1);
    }
  }
  calculateBillTotal();
}

function deletePosition() {
  positionToDelete.remove();
  removePositionFromTotal(positionToDelete);
  positionToDelete = null;

  totalFormsInput.value = parseInt(totalFormsInput.value) - 1;
}
