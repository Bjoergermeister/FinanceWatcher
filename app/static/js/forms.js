/**
 * Traverses the DOM-tree upwards until an element with a class of "form-row" is found or the root HTML element is reached
 * @param {HTMLElement} element
 * @returns An element with the class "form-row" or the root HTML element, whichever is encountered first
 */
function findFormRow(element) {
  let parent = element;

  do {
    parent = parent.parentElement;

    if (parent.tagName === "HTML") break;
  } while (parent.classList.contains("form-row") === false);

  return parent;
}

function cloneFormRow(formRow, newIndex, defaultValues) {
  const clone = formRow.cloneNode(true);

  const inputs = formRow.querySelectorAll("input");
  for (const input of inputs) {
    //input.name = input.name.replace(/\d+/g, newIndex);
    input.id = "";

    const name = input.name.substring(input.name.lastIndexOf("-") + 1);
    input.value =
      defaultValues !== undefined && name in defaultValues ? defaultValues[name] : "";
  }
}

function updateFormRowIndices(formRows) {
  for (let i = 0; i < formRows.length; i++) {
    const inputs = formRows[i].querySelectorAll("input");
    for (const input of inputs) {
      input.name = input.name.replace(/\d+/g, i);
      input.id = input.id.replace(/\d+/g, i);
    }
  }
}

/**
 * Returns the HTML element which acts as the container for the formset element is a part of
 * @param {HTMLElement} element - An element inside a formset container
 * @returns {HTMLElement} The HTML element which is the formset container
 */
function findFormsetContainer(element) {
  let parent = element;

  do {
    parent = parent.parentElement;

    // If we reached the HTML element (aka. the topmost element), there is no formset container and we can aboard.
    if (parent.tagName === "HTML") break;
  } while (
    Array.from(parent.classList).some(
      (className) => className.includes("formset") === false
    )
  );

  return parent;
}

function setTotalFormCount(container, count) {
  const totalFormCountInput = container.querySelector("input[name$='TOTAL_FORMS']");
  totalFormCountInput.value = count;
}

/**
 *
 * @param {HTMLElement} container - The HTML element which contains an input which name ends with "TOTAL_FORMS"
 * @returns {number}
 */
function getTotalFormCount(container) {
  const totalFormCountInput = container.querySelector("input[name$='TOTAL_FORMS']");
  return totalFormCountInput.value;
}

function setInitialFormCount(container, count) {
  const initialFormCountInput = container.querySelector("input[name$='INITIAL_FORMS']");
  initialFormCountInput.value = count;
}

function increaseFormCount(container) {
  const totalFormCountInput = container.querySelector("input[name$='TOTAL_FORMS']");
  totalFormCountInput.value = parseInt(totalFormCountInput.value) + 1;
}

function decreaseFormCount(container) {
  const totalFormCountInput = container.querySelector("input[name$='TOTAL_FORMS']");
  totalFormCountInput.value = parseInt(totalFormCountInput.value) - 1;
}
