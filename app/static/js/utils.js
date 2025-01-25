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
