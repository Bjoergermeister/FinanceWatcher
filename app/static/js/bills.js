const prices = [];
const quantities = [];

const positionNoteDialog = document.getElementById("position-note-dialog");
const positionNote = document.getElementById("bill-position-note");

(function registerEventListeners() {
  const priceInputs = document.querySelectorAll("#bill-form input[name$='price']");
  const quantityInputs = document.querySelectorAll("#bill-form input[name$='quantity']");

  for (const priceInput of priceInputs) {
    priceInput.addEventListener("change", onPositionPriceChanged);
    prices.push(priceInput.value);
  }

  for (const quantityInput of quantityInputs) {
    quantityInput.addEventListener("change", onPositionQuantityChanged);
    quantities.push(quantityInput.value);
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

  const noteDialog = document.getElementById("position-note-dialog");
  noteDialog.showModal();
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

  const data = new FormData(event.target);
  const result = await BillAPI.create(data);

  alert(result.success);

  return false;
}

async function onDeletePositionClicked(event) {
  event.preventDefault();

  // There must be at least one form row at all times.
  const totalFormsInput = document.querySelector(
    "#bill-positions input[name='form-TOTAL_FORMS']"
  );
  if (parseInt(totalFormsInput.value) == 1) return;

  // Remove the form row
  const element = event.target.parentElement.parentElement; // This will be the div.form-row
  element.remove();

  // Update the indices so that Django can correctly recognise the input values
  const formRows = document.querySelector(
    "#bill-positions .form-row:not(:first-of-type)"
  );
  updateFormRowIndices(formRows);

  totalFormsInput.value = parseInt(totalFormsInput.value) - 1;
}

function onNewPositionClicked(event) {
  event.preventDefault();

  const formRowContainer = event.target.parentElement; // This wil be the div#bill-positions
  const formRows = formRowContainer.querySelectorAll(".form-row");

  // Copy last form row and clear inputs
  const formRowCopy = formRows[formRows.length - 1].cloneNode(true);

  cloneFormRow(formRowCopy, formRows.length, {
    price: 0.0,
    quantity: 1.0,
  });

  formRows[formRows.length - 1].after(formRowCopy);

  // There is one extra form row which contains the columns heading and should not be counted, therefore no +1
  formRowContainer.querySelector("input[name='form-TOTAL_FORMS'").value = formRows.length;
}

/********************/
/* Helper Functions */
/********************/

function calculateBillTotal() {
  let total = 0;
  for (let i = 0; i < prices.length; i++) {
    total += prices[i] * quantities[i];
  }

  const totalDisplaySpan = document.getElementById("bill-sum");
  totalDisplaySpan.innerText = `${total} €`;
  document.querySelector("#bill-form input[name$='total']").value = total;
}
