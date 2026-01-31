/**
 * Returns the last element in the array.
 * If a predicate is given, the function returns the last element for which the predicate returns true or null if no element fulfills the predicate
 * @template T
 * @param {T[]} elements
 * @param {Function} predicate
 * @returns {T|null}
 */
function getLastElement(elements, predicate) {
  if (predicate === undefined) return elements[elements.length - 1];

  for (let i = elements.length - 1; i >= 0; i--) {
    if (predicate(elements[i]) === true) {
      return elements[i];
    }
  }

  return null;
}

/**
 * Traverses the DOM tree upwards until if either finds an element 
 * with the specified tag name or the root HTML element
 * @param {HTMLElement} element - The element whose parent element needs to be found
 * @param {string} tagName - The name of the HTML tag the function should look for
 * @return {HTMLElement} - The first parent tag with the specified tag name or the document root
 */
function findParentElement(element, tagName) {
  let parent = element.parentElement;

  while (true) {
    if (parent.tagName === tagName || parent.tagName === "HTML") {
      return parent;
    }

    parent = parent.parentElement;
  }
}

/**
 * Removes all child elements
 * @param {HTMLElement} container
 */
function removeAllChildren(container) {
  const childElementCount = container.children.length;
  if (childElementCount === 0) return;

  for (let i = childElementCount - 1; i >= 0; i--) {
    container.children[i].remove();
  }
}

/**
 * Looks for a template element with the id {templateName}-template and returns its root HTML element
 * @param {string} templateName - The name of the template
 * @param {boolean} clone - Whether the element should be cloned
 * @returns {HTMLElement | null} - The root HTML element of the template
 */
function getTemplate(templateName, clone){
  const templateId = `${templateName}-template`;
  const template = document.getElementById(templateId);
  if (template === null) return null;

  clone ??= true;
  return template.content.cloneNode(clone).children[0];
}


/**
 * Checks if the table has a table row with the class no-data (which gets displayed if a table has no actual data rows).
 * If the table row is found, it is hidden by setting the display value to "none"
 * @param {HTMLTableElement} table 
 */
function hideNoDataTableRow(table){
  const noDataTableRow = table.querySelector("tr.no-data");
  if (noDataTableRow){
    noDataTableRow.style.display = "none";
  }
}

/**
 * Displays the table row containing the information that the table has no actual data rows
 * @param {HTMLTableElement} table - The table who's no data table row should be displayed
 */
function showNoDataTableRow(table){
  const noDataTableRow = table.querySelector("tr.no-data");
  if (noDataTableRow){
    noDataTableRow.style.display = "table-row";
  }
}

/**
 * Check if a table has at least one table row with actual data (meaning a row with neither the "no-data" nor the "dummy" class)
 * @param {HTMLTableElement} table 
 * @returns True if the table has at least one row with actual data, otherwise false
 */
function tableHasDataRows(table){
  const tableRows = table.querySelectorAll("tr:not(.dummy):not(.no-data)");
  return tableRows.length > 0;
}