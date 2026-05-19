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

    // The brand and address inputs are disabled and therefore not being picked up by the FormData constructor.
    // So we need to add them manually
    data.append("brand", form.brand.value);
    data.append("address", form.address.value);
    result = await BillAPI.create(data);
  } else {
    // The bill already exists in the database. It needs to be updated
    
    // In Django Formsets, new entries must always be at the very "end" of the data, meaning that all existing
    // rows must be before any new ones. Since new positions can be added to different groups,
    // new positions may be at the start, middle or end of the positions list.
    // Therefore, we need to reorder them to make sure all new ones are at the end. 
    const data = preprocessPositionFormRows(positionFormRows);

    // Adding the rest of the data. It's easier to add these by hand to an empty FormData object
    // than just taking all the form input, filter out the position data and then reordering it.
    data.append("csrfmiddlewaretoken", form.csrfmiddlewaretoken.value);
    data.append("id", form.id.value);
    data.append("name", form.name.value);
    data.append("date", form.date.value);
    data.append("receipt", form.receipt.files.length > 0 ? form.receipt.files[0] : "");
    data.append("description", form.description.value);
    data.append("total", form.total.value);
    data.append("brand", form.brand.value);
    data.append("address", form.address.value);
    data.append("position-TOTAL_FORMS", form.elements["position-TOTAL_FORMS"].value);
    data.append("position-INITIAL_FORMS", form.elements["position-INITIAL_FORMS"].value);
    data.append("position-MIN_NUM_FORMS", form.elements["position-MIN_NUM_FORMS"].value);
    data.append("position-MAX_NUM_FORMS", form.elements["position-MAX_NUM_FORMS"].value);
    
    // Since the creator (user) of a bill cannot be changed, there is no user id input when editing a bill.
    // Therefore we need to check if the form has a user field before adding it.
    if (form.user !== undefined){
      data.append("user", form.user.value);
    }

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
  quantityInput.addEventListener("change", onPositionQuantityChanged);

  positions[uuid] = {
    price: 0.0,
    quantity: 1.0,
  };

  formRows[formRows.length - 1].after(formRowCopy);

  const positionContainer = document.getElementById("group-container");
  increaseFormCount(positionContainer);

  // Check if the position is part of a group. If so, set the group ID
  const groupContainer = findParentElement(event.target, "FIELDSET");
  if ("groupId" in groupContainer.dataset) {
    formRowCopy.querySelector("input[name$='group']").value = groupContainer.dataset.groupId;
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

    groupContainer.dataset.groupId = groupSelectedEvent.target.dataset.id;
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

/**
 * 
 * @param {KeyboardEvent} event - The event 
 */
async function onBrandSearchInputChanged(event){
  event.preventDefault();

  if (searchBrandInputTimeout !== null){
    clearTimeout(searchBrandInputTimeout);
  }

  if (event.key === "Enter"){
    searchBrands(event.target.value);
  }else{
    searchBrandInputTimeout = setTimeout(async () => searchBrands(event.target.value), 5000);
  }
}

/**
 * 
 * @param {PointerEvent} event 
 */
function onSearchBrandsClicked(event){
  event.preventDefault();

  const query = document.getElementById("brand-search-input").value;
  searchBrands(query);
}

async function searchBrands(query){
  const result = await BrandAPI.search(query);
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
      template.classList.add("clickable");
      template.querySelector("img").src = brand.icon;
      template.querySelector("h4").innerText = brand.name;
      template.dataset.id = brand.pk;
      template.dataset.name = brand.name;
      template.addEventListener("click", onBrandSelected);
      return template;
    });

    const imageContainer = document.getElementById("brand-list");
    imageContainer.replaceChildren(...images);
}

function onBrandSelected(event){
  event.preventDefault();

  const dialog = findParentElement(event.target, "DIALOG");
  dialog.close();

  const select = document.querySelector("#bill-form select[name='brand']");
  const { id, name } = event.currentTarget.dataset;

  // Check if a brand was choosen before and if it's different from the one chosen now.
  // If so, reset the address select to prevent corrupted data. This obviously needs to be done
  // before the select is updated to the new brand
  if (select.children[0].innerText !== name){
    const addressSelect = document.querySelector("#bill-form select[name='address']");
    addressSelect.value = "";
    addressSelect.children[0].value = "";
    addressSelect.children[0].innerText = "";
  }

  select.children[0].value = parseInt(id);
  select.children[0].innerText = name;
  select.value = parseInt(event.currentTarget.dataset.id);

  // Enable address selection
  const chooseAddressButton = document.getElementById("choose-address-button");
  chooseAddressButton.disabled = false;
  chooseAddressButton.title = "";
}

/**
 * 
 * @param {PointerEvent} event 
 */
function onAbortSearchBrandClicked(event){
  event.preventDefault();
  document.getElementById("brand-search-input").value = "";
  const brandList = document.getElementById("brand-list");
  removeAllChildren(brandList);

  const dialog = findParentElement(event.target, "DIALOG");
  dialog.close();
}

function onSelectAddressClicked(event){
  event.preventDefault();

  const chooseAddressDialog = document.getElementById("select-address-dialog");
  chooseAddressDialog.showModal();
}

let searchAddressInputTimeout = null;

/**
 * 
 * @param {KeyboardEvent} event 
 */
function onAssignAddressInputChanged(event){
    event.preventDefault();

    if (searchAddressInputTimeout !== null){
        clearTimeout(searchAddressInputTimeout);
    }

    searchAddressInputTimeout = setTimeout(() => updateAddressChoices(event.target.form), 3000);
}

/**
 * 
 * @param {PointerEvent} event 
 */
function onUpdateAddressesClicked(event){
  event.preventDefault();

  if (searchAddressInputTimeout !== null){
    clearTimeout(searchAddressInputTimeout);
  }

  updateAddressChoices(event.target.form);
}

function onSelectAddressFormSubmitted(event){
  event.preventDefault();
  const form = event.target;
  const availableAddressesSelect = form["available-addresses"];
  const selectedAddressOption = availableAddressesSelect.querySelector(`option[value='${availableAddressesSelect.value}']`);
  if (selectedAddressOption === null) return;


  const targetSelect = document.querySelector("#bill-form select[name='address']");
  const targetOption = targetSelect.querySelector("option");
  targetOption.innerText = selectedAddressOption.innerText;
  targetOption.value = availableAddressesSelect.value;
  targetSelect.value = availableAddressesSelect.value;

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

    const addressesSelect = document.querySelector("select[name='available-addresses']");
    const noAddressesHint = document.getElementById("no-addresses-hint");

    // If no address was returned, hide the table and show the "no addresses matches the parameters" hint
    if (result.content.length === 0){
      removeAllChildren(addressesSelect);
      noAddressesHint.style.display = "block";
      return;
    }

    noAddressesHint.style.display = "none";
    const options = result.content.map(address => {
        const option = document.createElement("OPTION");
        option.value = address.id;
        option.textContent = `${address.street} ${address.number}, ${address.postal_code}, ${address.city}`;
        return option;
    });

    addressesSelect.replaceChildren(...options);
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
