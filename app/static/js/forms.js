function cloneFormRow(formRow, newIndex, defaultValues) {
  const clone = formRow.cloneNode(true);

  const inputs = formRow.querySelectorAll("input");
  for (const input of inputs) {
    input.name = input.name.replace(/\d+/g, newIndex);
    input.id = input.id.replace(/\d+/g, newIndex);

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
