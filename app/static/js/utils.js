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
 * Traverses the DOM tree upwards until if either finds an element with the specified tag name or the root HTML element
 * @param {HTMLElement} element - The element whose parent element needs to be found
 * @param {string} tagName - The name of the HTML tag the function should look for
 * @param {HTMLElement} - The
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
