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
