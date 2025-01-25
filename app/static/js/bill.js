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

/*
async function onCreateBillFormSubmitted(event) {
  event.preventDefault();

  const form = event.target;
  const formRows = form.querySelectorAll(".form-row.position");
  updateFormRowIndices(formRows);

  const data = new FormData(form);
  const result = await BillAPI.create(data);

  if (result.success === false) {
    alert("Ein Fehler ist aufgetreten");
    return;
  }

  // Set IDs of the bill and the positions
  const billIdInput = document.querySelector("input[name='id']");
  billIdInput.value = result.content.bill;

  const billPositions = document.getElementById("bill-positions");

  for (const uuid of Object.keys(result.content.positions)) {
    const positionIdInput = billPositions.querySelector(
      `div[data-uuid='${uuid}'] input[name$="id"]`
    );

    const id = result.content.positions[uuid];
    positionIdInput.value = id;
  }

  const currentFormCount = getTotalFormCount(billPositions);
  setInitialFormCount(billPositions, currentFormCount);

  return false;
}

async function onEditBillFormSubmitted(event) {
  event.preventDefault();

  const form = event.target;
  const formRows = form.querySelectorAll(".form-row.position");

  const data = preprocessPositionFormRows(formRows);
  data.append("csrfmiddlewaretoken", form.csrfmiddlewaretoken.value);
  data.append("id", form.id.value);
  data.append("name", form.name.value);
  data.append("date", form.date.value);
  data.append("receipt", form.receipt.files[0]);
  data.append("description", form.description.value);
  data.append("user", form.user.value);
  data.append("total", form.total.value);
  data.append("position-TOTAL_FORMS", form.elements["position-TOTAL_FORMS"].value);
  data.append("position-INITIAL_FORMS", form.elements["position-INITIAL_FORMS"].value);
  data.append("position-MIN_NUM_FORMS", form.elements["position-MIN_NUM_FORMS"].value);
  data.append("position-MAX_NUM_FORMS", form.elements["position-MAX_NUM_FORMS"].value);

  const result = await BillAPI.edit(BILL_ID, data);

  alert(result.success);

  return false;
}
*/

async function onBillFormSubmitted(event) {
  event.preventDefault();

  const form = event.target;
  const positionFormRows = form.querySelectorAll("#bill-positions .form-row.position");

  let result = undefined;
  if (form.id.value === "") {
    // The bill does not exist in the database yet. A new one needs to be created.

    updateFormRowIndices(positionFormRows);

    const data = new FormData(form);
    result = await BillAPI.create(data);
  } else {
    // The bill already exists in the database. It needs to be updated
    const data = preprocessPositionFormRows(positionFormRows);
    data.append("csrfmiddlewaretoken", form.csrfmiddlewaretoken.value);
    data.append("id", form.id.value);
    data.append("name", form.name.value);
    data.append("date", form.date.value);
    data.append("receipt", form.receipt.files[0]);
    data.append("description", form.description.value);
    data.append("user", form.user.value);
    data.append("total", form.total.value);
    data.append("position-TOTAL_FORMS", form.elements["position-TOTAL_FORMS"].value);
    data.append("position-INITIAL_FORMS", form.elements["position-INITIAL_FORMS"].value);
    data.append("position-MIN_NUM_FORMS", form.elements["position-MIN_NUM_FORMS"].value);
    data.append("position-MAX_NUM_FORMS", form.elements["position-MAX_NUM_FORMS"].value);

    result = await BillAPI.edit(form.id.value, data);
  }

  if (result.success === false) {
    alert("Ein Fehler ist aufgetreten");
    return;
  }

  // Set IDs of the bill and the positions
  const billIdInput = document.querySelector("input[name='id']");
  billIdInput.value = result.content.bill;

  const billPositions = document.getElementById("bill-positions");

  for (const uuid of Object.keys(result.content.positions)) {
    const positionIdInput = billPositions.querySelector(
      `div[data-uuid='${uuid}'] input[name$="id"]`
    );

    const id = result.content.positions[uuid];
    positionIdInput.value = id;
  }

  const currentFormCount = getTotalFormCount(billPositions);
  setInitialFormCount(billPositions, currentFormCount);

  // Remove deleted form rows
  const deletedFormRows = billPositions.querySelectorAll(".form-row.deleted");
  for (const deletedFormRow of deletedFormRows) {
    deletedFormRow.remove();
    decreaseFormCount(billPositions);
  }

  setInitialFormCount(billPositions, getTotalFormCount(billPositions));

  return false;
}

async function onDeletePositionClicked(event) {
  event.preventDefault();

  const button = event.currentTarget;
  const formRow = findFormRow(button);
  const positionId = formRow.querySelector("input[name$='id']").value;

  const formsetContainer = findFormsetContainer(formRow);

  if (positionId === "") {
    decreaseFormCount(formsetContainer);
    formRow.remove();
  } else {
    formRow.querySelector("input[name$='DELETE']").value = button.dataset.id;
    formRow.classList.add("deleted");
    formRow.style.display = "none";
  }
}

function onNewPositionClicked(event) {
  event.preventDefault();

  const formRowContainer = findFormsetContainer(event.target);
  const formRows = formRowContainer.querySelectorAll(".form-row:not(:first-of-type)");

  // Copy last form row and clear inputs
  const formRowCopy = getLastElement(
    formRows,
    (formRow) => formRow.style.display !== "none"
  ).cloneNode(true);

  const uuid = generateUUID();
  formRowCopy.dataset.uuid = uuid;
  cloneFormRow(formRowCopy, formRows.length, {
    uuid: uuid,
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

  const positionContainer = document.getElementById("bill-positions");
  increaseFormCount(positionContainer);

  // Check if the position is part of a group. If so, set the group ID
  const groupId = event.target.parentElement.dataset.groupid;
  if (groupId !== undefined) {
    formRowCopy.querySelector("input[name$='group']").value = groupId;
  }
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

  const positionsContainer = document.getElementById("bill-positions");
  decreaseFormCount(positionsContainer);
}

function preprocessPositionFormRows(formRows) {
  const positions = Array.from(formRows).map((formRow) => ({
    id: formRow.querySelector("[name$='id']").value,
    uuid: formRow.querySelector("[name$='uuid']").value,
    group: formRow.querySelector("[name$='group']").value,
    name: formRow.querySelector("[name$='name']").value,
    price: formRow.querySelector("[name$='price']").value,
    quantity: formRow.querySelector("[name$='quantity']").value,
    note: formRow.querySelector("[name$='note']").value,
    DELETE: formRow.querySelector("[name$='DELETE']").value,
  }));

  positions.sort((first, second) => {
    if (first.id === "" && second.id !== "") return 1;
    if (first.id !== "" && second.id === "") return -1;
    if (first.id === "" && second.id === "") return 0;
    return parseInt(first.id) - parseInt(second.id);
  });

  const data = new FormData();
  for (let i = 0; i < positions.length; i++) {
    for (const key of Object.keys(positions[i])) {
      data.append(`position-${i}-${key}`, positions[i][key]);
    }
  }

  return data;
}

function generateUUID() {
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (+c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))).toString(16)
  );
}
