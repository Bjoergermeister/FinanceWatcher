/**
 * Traverses the DOM-tree upwards until an element with a class of "form-row" is found or the root HTML element is reached
 * @param {HTMLElement} element
 * @returns {HTMLElement} An element with the class "form-row" or the root HTML element, whichever is encountered first
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
        input.id = "";

        const name = input.name.substring(input.name.lastIndexOf("-") + 1);
        input.value = defaultValues !== undefined && name in defaultValues ? defaultValues[name] : "";
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

/**
 * Display error messages for form elements
 * @param {HTMLFormElement} form - The form elements which contains the inputs
 * @param {Object} errors - The individual error messages for the form inputs
 */
function displayFormErrors(form, formErrors){
    // First, display all errors for specific inputs
    for (fieldName in formErrors){
        // 
        if (fieldName === "__all__") continue;

        let field = form.querySelector(`[name$='${fieldName}']`);
        if (field === null) continue;

        field.classList.add("is-invalid");

        const fieldContainer = form.querySelector(`div[id$='${fieldName}']`);
        if (fieldContainer == null) continue;

        const errorParagraph = `<p class="invalid-feedback" style="display: block;"><strong>${formErrors[fieldName]}</strong></p>`;
        fieldContainer.insertAdjacentHTML("beforeend", errorParagraph);
    }

    // Now display errors for the whole form (if there are any)
    if (formErrors.hasOwnProperty("__all__")){
        const errors = formErrors["__all__"];
        const errorAlert = createErrorAlert(errors);
        form.insertAdjacentElement("beforeend", errorAlert);
    }
}

/**
 * Removes all error messages from the form
 * @param {HTMLFormElement} form
 */
function removeFormErrors(form){
    // First remove all is-invalid classes from the inputs
    const invalidInputs = form.querySelectorAll(".is-invalid");
    for (const input of invalidInputs){
        input.classList.remove("is-invalid");
    }

    // Remove the error messages for the individual inputs
    const errors = form.querySelectorAll(".invalid-feedback");
    for (const error of errors){
        error.remove();
    }

    // Remove the error alert for the whole form (if it exists)
    const formErrorAlert = form.querySelector(".alert.alert-danger");
    if (formErrorAlert !== null){
        formErrorAlert.remove();
    }
}

/**
 * Create a Bootstrap alert element
 * @param {string} alertClass - The Bootstrap alert class to apply
 * @returns {HTMLDivElement} - The alert element
 */
function createAlert(alertClass){
    const alertContainer = document.createElement("DIV");
    alertContainer.classList.add("alert", "m-3", alertClass);
    alertContainer.role = "alert";
    return alertContainer;
}

/**
 * Create a Bootstrap alert element which displays error messages
 * @param {string[]} errors - The error messages to display
 * @returns {HTMLDivElement} - The alert element
 */
function createErrorAlert(errors){
    const container = createAlert("alert-danger");
    
    if (errors.length === 1){
        container.innerHTML = `<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>${errors[0]}`;
    }else{
        const errorListItems = errors.map(error => `<li>${error}</li>`);
        container.innerHTML = `<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button><ul>${errorListItems.join("")}</ul>`;
    }
    return container;
}

/**
 * Resets all input elements in the form.
 * 
 * All inputs whose name is in the exceptFields array will not be resetted
 * @param {HTMLFormElement} form 
 * @param {String[]} exceptFields 
 */
function resetForm(form, exceptFields){
    exceptFields ??= [];

    for (const element of form.elements){
        if (exceptFields.includes(element.name)) continue;

        if (element.tagName === "INPUT" && element.type === "checkbox"){
            element.checked = false;
        }

        if (element.tagName === "INPUT" || element.tagName === "TEXTAREA"){
            element.value = "";
        }

        if (element.tagName === "SELECT"){
            element.value = element.querySelector("option").value;
        }
    }
}

