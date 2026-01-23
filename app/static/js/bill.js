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
let categoryChosenCallback = null;

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

// I could have used an IIFE here, but it seems like those don't work with JSDoc,
// so I'm doing it this way.
registerEventListeners();

/******************/
/* Event handlers */
/******************/

/**
 * Updates the total price of the bill when the price of a position changes
 * @param {Event} event 
 */
function onPositionPriceChanged(event) {
  const formRow = findFormRow(event.target);
  const uuid = formRow.dataset.uuid;

  positions[uuid].price = parseFloat(event.target.value);

  calculateBillTotal();
}

/**
 * Updates the total price of the bill when the quantity of a position changes
 * @param {Event} event 
 */
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
    data.append("receipt", form.receipt.files.length > 0 ? form.receipt.files[0] : "");
    data.append("description", form.description.value);
    data.append("user", form.user.value);
    data.append("total", form.total.value);
    data.append("brand", form.brand.value);
    data.append("address", form.address.value);
    data.append("position-TOTAL_FORMS", form.elements["position-TOTAL_FORMS"].value);
    data.append("position-INITIAL_FORMS", form.elements["position-INITIAL_FORMS"].value);
    data.append("position-MIN_NUM_FORMS", form.elements["position-MIN_NUM_FORMS"].value);
    data.append("position-MAX_NUM_FORMS", form.elements["position-MAX_NUM_FORMS"].value);

    result = await BillAPI.edit(form.id.value, data);
  }

  if (result.success === false) {
    sendNotification(
      "Fehler beim Speichern der Rechnung", 
      `Die Rechnung konnte nicht gespeichert werden: ${result.errors}.`, 
      NOTIFICATION_TYPE_ERROR
    );
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

  storeNotification(
    "Rechnung gespeichert", 
    `Die Rechnung \"${form.name.value}\" wurde erfolgreich gespeichert.`,
    NOTIFICATION_TYPE_SUCCESS
  );

  window.location.href = "/";
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

async function onNewGroupButtonClicked(event) {
  event.preventDefault();

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
    sendNotification(
      "Gruppen abfragen fehlgeschlagen",
      `Konnte keine Gruppen abfragen: ${result.errors}`,
      NOTIFICATION_TYPE_ERROR
    );
    return;
  }

  for (const userGroup of result.content.user_groups) {
    const groupElement = createGroupElement(userGroup);
    userGroupList.appendChild(groupElement);
  }

  for (const globalGroup of result.content.global_groups) {
    const groupElement = createGroupElement(globalGroup);
    globalGroupList.appendChild(groupElement);
  }

  groupChosenCallback = function (event) {
    // Copy group from template, fill with values and insert into DOM
    const groupCopy = positionGroupTemplate.content.cloneNode(true).children[0];
    groupCopy.querySelector("img").src = `${event.target.dataset.icon}`;
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
      const groupIdInput = positionFormRow.querySelector("input[name$='group']");
      groupIdInput.value = event.target.dataset.id;
    }

    registerEventListeners(positionFormRows);

    const container = document.getElementById("group-container");
    container.appendChild(groupCopy);

    totalFormsInput.value = parseInt(totalFormsInput.value) + 5;

    chooseGroupDialog.close();
  };
}

function onAbortChoosingGroupClicked(event) {
  const dialog = findParentElement(event.target, "DIALOG");
  dialog.close();
}

function onGroupSelected(event) {
  event.preventDefault();
  groupChosenCallback(event);
}

async function onEditGroupClicked(event) {
  event.preventDefault();

  const groupHeader = findParentElement(event.target, "HEADER");
  const groupContainer = groupHeader.parentElement;

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
    sendNotification(
      "Gruppen abfragen fehlgeschlagen",
      `Konnte Gruppen nicht abfragen: ${result.errors}`,
      NOTIFICATION_TYPE_ERROR
    );
    return;
  }

  for (const userGroup of result.content.user_groups) {
    const groupElement = createGroupElement(userGroup);
    userGroupList.appendChild(groupElement);
  }

  for (const globalGroup of result.content.global_groups) {
    const groupElement = createGroupElement(globalGroup);
    globalGroupList.appendChild(groupElement);
  }

  groupChosenCallback = function (groupSelectedEvent) {
    groupHeader.querySelector("img").src = groupSelectedEvent.target.dataset.icon;
    groupHeader.querySelector("h2").innerText = groupSelectedEvent.target.dataset.name;

    const positionFormRows = groupContainer.querySelectorAll(".form-row.position");
    for (const positionFormRow of positionFormRows) {
      const groupInput = positionFormRow.querySelector("input[name$='group']");
      groupInput.value = groupSelectedEvent.target.dataset.id;
    }

    chooseGroupDialog.close();
  };
}

async function onSelectBrandButtonPressed(event) {
  event.preventDefault();

  const brandSelectDialog = document.getElementById("select-brand-dialog");
  brandSelectDialog.showModal();

  const result = await BrandAPI.getAll();
  if (result.success === false) {
    sendNotification(
      "Brands abfragen fehlgeschlagen",
      `Konnte keine Brands abfragen: ${result.errors}`,
      NOTIFICATION_TYPE_ERROR
    );
    return;
  }

  console.log(result.content);
}

function onReceiptImageChanged(event) {
  event.preventDefault();
  
  const fileInput = event.target;
  if (fileInput.files.length == 0) return;

  const imagePreview = fileInput.nextElementSibling.firstElementChild;
  imagePreview.src = URL.createObjectURL(event.target.files[0]);
}

function onShowReceiptClicked(event){
  event.preventDefault();

  const currentBillUrl = event.target.parentElement.previousElementSibling;

  const billReceiptDialog = document.getElementById("bill-receipt-dialog")
  const billReceipt = billReceiptDialog.querySelector("img");
  billReceipt.src = currentBillUrl.src;

  billReceiptDialog.showModal();
}

let searchBrandInputTimeout = null;
async function onBrandSearchInputChanged(event){
  event.preventDefault();

  if (searchBrandInputTimeout !== null){
    clearTimeout(searchBrandInputTimeout);
  }

  searchBrandInputTimeout = setTimeout(async () => {
    const result = await BrandAPI.search(event.target.value);
    if (result.success === false){
      sendNotification(
        "Laden fehlgeschlagen",
        "Marken konnte nicht geladen werden",
        NOTIFICATION_TYPE_ERROR
      );
      return;
    }

    const images = result.content.map(brand => {
      const template = getTemplate("select-brand");
      if (template === null) return;
      template.querySelector("img").src = brand.icon;
      template.querySelector("h4").innerText = brand.name;
      template.dataset.id = brand.pk;
      template.addEventListener("click", onBrandSelected);
      return template;
    });

    const imageContainer = document.getElementById("brand-list");
    imageContainer.replaceChildren(...images);
  }, 3000);
}

function onBrandSelected(event){
  event.preventDefault();

  const dialog = findParentElement(event.target, "DIALOG");
  dialog.close();

  const select = document.querySelector("#bill-form select[name='brand']");
  select.value = parseInt(event.currentTarget.dataset.id);

  const chooseAddressButton = document.getElementById("choose-address-button");
  chooseAddressButton.disabled = false;
  chooseAddressButton.title = "";
}

function onSelectAddressClicked(event){
  event.preventDefault();

  const chooseAddressDialog = document.getElementById("select-address-dialog");
  chooseAddressDialog.showModal();
}

let searchAddressInputTimeout = null;
function onAssignAddressInputChanged(event){
    event.preventDefault();

    if (searchAddressInputTimeout !== null){
        clearTimeout(searchAddressInputTimeout);
    }

    searchAddressInputTimeout = setTimeout(() => updateAddressChoices(event.target.form), 3000);
}

function onSelectAddressFormSubmitted(event){
  event.preventDefault();
  const form = event.target;
  const selectedAddressOption = form.address.querySelector(`option[value='${form.address.value}']`);
  if (selectedAddressOption === null) return;


  const targetSelect = document.querySelector("#bill-form select[name='address']");
  const targetOption = targetSelect.querySelector("option");
  targetOption.innerText = selectedAddressOption.innerText;
  targetOption.value = form.address.value;
  targetSelect.value = form.address.value;

  const dialog = findParentElement(form, "DIALOG");
  dialog.close();
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
  image.src = group.icon;
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
 * Updates the possible address choices based on the filter in the filter form
 * @param {HTMLFormElement} form - The form used to filter addresses
 * @returns 
 */
async function updateAddressChoices(form){
    const brandId = document.querySelector("select[name='brand']").value;
    const data = new FormData(form);
    data.set("brand", brandId);
    data.delete("id");
    data.delete("csrfmiddlewaretoken");
    
    const result = await AddressesAPI.search(data);
    if (result.success === false){
        alert("Error");
        return;
    }

    const addressesTable = document.getElementById("addresses-table");
    const noAddressesHint = document.getElementById("no-addresses-hint");

    // If no address was returned, hide the table and show the "no addresses matches the parameters" hint
    if (result.content.length === 0){
      addressesTable.style.display = "none";
      noAddressesHint.style.display = "none";
      return;
    }

    const options = result.content.map(address => {
        const option = document.createElement("OPTION");
        option.value = address.id;
        option.textContent = `${address.street} ${address.number}, ${address.postal_code}, ${address.city}`;
        return option;
    });

    const assignAddressesForm = document.getElementById("choose-address-form");
    assignAddressesForm.address.replaceChildren(...options);
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
