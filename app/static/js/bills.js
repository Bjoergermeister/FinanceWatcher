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
}
