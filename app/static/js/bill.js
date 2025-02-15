const positions = {};

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

/**
 * Registers event listeners for all events
 * @param {HTMLElement[]} positionFormRows - The position form rows for which event listeners should be registered
 */
function registerEventListeners(positionFormRows) {
  if (positionFormRows === undefined) {
    positionFormRows = document.querySelectorAll("div.position.form-row");
  }

  for (const positionFormRow of positionFormRows) {
    const uuid = positionFormRow.dataset.uuid;

    const priceInput = positionFormRow.querySelector("input[name$='price']");
    priceInput.addEventListener("change", onPositionPriceChanged);

    const quantityInput = positionFormRow.querySelector("input[name$='quantity']");
    quantityInput.addEventListener("change", onPositionQuantityChanged);

    positions[uuid] = {
      price: parseFloat(priceInput.value),
      quantity: parseFloat(quantityInput.value),
    };
  }
}

// I could have used an IIFE here, but it seems like those don't work with JSDoc, so I'm doing it this way.
registerEventListeners();

/******************/
/* Event handlers */
/******************/

function onPositionPriceChanged(event) {
  const formRow = findFormRow(event.target);
  const uuid = formRow.dataset.uuid;

  positions[uuid].price = parseFloat(event.target.value);

  calculateBillTotal();
}

function onPositionQuantityChanged(event) {
  const formRow = findFormRow(event.target);
  const uuid = formRow.dataset.uuid;

  positions[uuid].quantity = parseFloat(event.target.value);

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

async function onBillFormSubmitted(event) {
  event.preventDefault();

  const form = event.target;
  const positionFormRows = form.querySelectorAll(".form-row.position");

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

  const billPositions = document.getElementById("group-container");

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

  removePositionFromTotal(formRow);
}

function onNewPositionClicked(event) {
  event.preventDefault();

  const formRowContainer = findParentElement(event.target, "FIELDSET");
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

  const quantityInput = formRowCopy.querySelector("input[name$='quantity']");
  quantityInput.addEventListener("change", onPositionPriceChanged);

  positions[uuid] = {
    price: 0.0,
    quantity: 1.0,
  };

  formRows[formRows.length - 1].after(formRowCopy);

  const positionContainer = document.getElementById("group-container");
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

  // Remove all groups so that they are not selectable anymore.
  // This is done before new groups are fetched to avoid them being visible for a short time due to the round-trip to the server
  const userGroupList = document.getElementById("user-group-list");
  const globalGroupList = document.getElementById("global-group-list");
  removeAllChildren(userGroupList);
  removeAllChildren(globalGroupList);

  chooseGroupDialog.showModal();

  const alreadyChoosenGroups = Array.from(
    document.querySelectorAll(".position-group")
  ).map((groupContainer) => parseInt(groupContainer.dataset.groupid));

  const result = await GroupAPI.getAll(alreadyChoosenGroups);
  if (result.success === false) {
    alert("Failure");
  }

  for (const userGroup of result.content.user_groups) {
    const groupElement = createGroupElement(userGroup);
    userGroupList.appendChild(groupElement);
  }

  for (const globalGroup of result.content.global_groups) {
    const groupElement = createGroupElement(globalGroup);
    globalGroupList.appendChild(groupElement);
  }
}

function onAbortChoosingGroupClicked(event) {
  const dialog = findParentElement(event.target, "DIALOG");
  dialog.close();
}

function onGroupSelected(event) {
  event.preventDefault();

  // Copy group from template, fill with values and insert into DOM
  const groupCopy = positionGroupTemplate.content.cloneNode(true).children[0];
  groupCopy.querySelector("img").src = `/media/${event.target.dataset.icon}`;
  groupCopy.querySelector("h2").innerText = event.target.dataset.name;

  groupCopy.dataset.groupid = event.target.dataset.id;

  // We need to make sure that the UUIDs of all positions are unique, so we need
  // to replace the copied ones by newly generated ones.
  const positionFormRows = groupCopy.querySelectorAll("div.form-row.position");
  for (const positionFormRow of positionFormRows) {
    const newUUID = generateUUID();
    positionFormRow.dataset.uuid = newUUID;
    positionFormRow.querySelector("input[name$='uuid']").value = newUUID;

    // Also set group id for the position
    positionFormRow.querySelector("input[name$='group']").value = event.target.dataset.id;
  }

  registerEventListeners(positionFormRows);

  const container = document.getElementById("group-container");
  container.appendChild(groupCopy);

  totalFormsInput.value = parseInt(totalFormsInput.value) + 5;

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

/**
 * Calculates the sum of all items on the bill
 */
function calculateBillTotal() {
  const total = Object.values(positions).reduce((previousValue, currentValue) => {
    return previousValue + currentValue.price * currentValue.quantity;
  }, 0);

  const totalDisplaySpan = document.getElementById("bill-sum");
  totalDisplaySpan.innerText = `${total.toFixed(2)} €`;
  document.querySelector("#bill-form input[name$='total']").value = total.toFixed(2);
}

/**
 * Removes a position from the bill total
 * @param {HTMLDivElement} formRow - The form row which represents the position
 */
function removePositionFromTotal(formRow) {
  const uuid = formRow.dataset.uuid;

  delete positions[uuid];

  calculateBillTotal();
}

function deletePosition() {
  removePositionFromTotal(positionToDelete);
  positionToDelete.remove();
  positionToDelete = null;

  const positionsContainer = document.getElementById("group-container");
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

/**
 * Generates a UUID
 * @returns {string} A UUID
 */
function generateUUID() {
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (+c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))).toString(16)
  );
}
