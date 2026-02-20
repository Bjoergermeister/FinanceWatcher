let timeout = null;

// ####################
// # TYPE DEFINITIONS #
// ####################

/**
 * @typedef {Object} Brand
 * @property {String} name
 * @property {String} icon
 * @property {String} default_channel
 * @property {boolean} has_physical_stores
 */

// ###################
// # EVENT LISTENERS #
// ###################

function onAddBrandClicked(event) {
    event.preventDefault();
    const addBrandDialog = document.getElementById('add-brand-dialog');
    addBrandDialog.showModal();
}

function onBrandImageChanged(event) {
  event.preventDefault();

  if (event.target.files.length === 0) return;

  const form = findParentElement(event.target, "FORM");
  const imagePreview = form.querySelector(".image-preview");
  imagePreview.src = URL.createObjectURL(event.target.files[0]);
}

async function onBrandFormSubmitted(event){
    event.preventDefault();

    const form = event.target;
    const data = new FormData(form);
    const brandId = data.get("id");
    const isEdit = brandId !== "";

    removeFormErrors(form);

    const result = (isEdit)
        ? await BrandAPI.edit(brandId, data)
        : await BrandAPI.create(data);
    if (result.success === false){
        if (result.errors instanceof Object && "form" in result.errors){
            displayFormErrors(form, result.errors.form);
        }
        sendNotification(
            "Speichern fehlgeschlagen",
            "Marke konnte nicht gespeichert werden",
            NOTIFICATION_TYPE_ERROR
        );
        return;
    }

    if (isEdit){
        const cells = document.querySelectorAll(`#brands-table tbody tr[data-id='${brandId}'] td`);
        cells[0].children[0].src = result.content.icon;
        cells[1].innerText = result.content.name;
        cells[2].innerText = result.content.has_physical_stores;
        cells[3].innerText = result.content.default_channel;
    }else{
        const brandTableRowBody = document.querySelector("#brands-table tbody");
        const newBrandTableCell = createNewBrandTableRow(result.content);
        brandTableRowBody.insertAdjacentElement("afterbegin", newBrandTableCell);
    }

    sendNotification(
        "Speichern erfolgreich",
        "Marke wurde erfolgreich gespeicher",
        NOTIFICATION_TYPE_SUCCESS
    );

    const dialog = findParentElement(form, "DIALOG");
    dialog.close();
}

/**
 * This function is called when the edit icon on a brand table row is clicked.
 * It loads the brand from the API and displays the information in an edit dialog.
 * @param {PointerEvent} event The PointerEvent
 * @returns 
 */
async function onEditBrandClicked(event){
    const brandId = event.currentTarget.dataset.id;
    const result = await BrandAPI.get(brandId);
    if (result.success === false){
        sendNotification(
            "Laden fehlgeschlagen",
            "Das Laden der Marke ist fehlgeschlagen",
            NOTIFICATION_TYPE_ERROR
        );
        return;
    }

    const brand = result.content;

    const dialog = document.getElementById("add-brand-dialog");
    dialog.querySelector("input[name='id']").value = brand.pk;
    dialog.querySelector("input[name='name']").value = brand.name;
    dialog.querySelector("input[name='has_physical_stores']").checked = brand.has_physical_stores;
    dialog.querySelector("img.image-preview").src = brand.icon;

    const option = dialog.querySelector(`option[value='${brand.default_channel}']`);
    dialog.querySelector("select").value = option.value;

    dialog.showModal();
}

/**
 * 
 * @param {PointerEvent} event - The PointerEvent 
 */
async function onDeleteBrandClicked(event){
    const dialog = document.getElementById("confirm-delete-brand-dialog");
    dialog.showModal();

    dialog.querySelector("form").dataset.id = event.currentTarget.dataset.id;
    dialog.querySelector("#title-brand-name").innerText = event.currentTarget.dataset.name;
    dialog.querySelector("#body-brand-name").innerText = event.currentTarget.dataset.name;
}

/**
 * 
 * @param {SubmitEvent} event 
 * @returns 
 */
async function onConfirmDeleteBrandFormSubmitted(event){
    event.preventDefault();

    const brandId = event.currentTarget.dataset.id;
    const result = await BrandAPI.delete(brandId);
    if (result.success === false){
        sendNotification(
            "Löschen fehlgeschlagen",
            `Die Marke konnte nicht gelöscht werden: ${result.errors}`,
            NOTIFICATION_TYPE_ERROR
        );
        return;
    }

    const tableRow = document.querySelector(`tr[data-id='${event.target.dataset.id}']`);
    tableRow.remove();

    const dialog = findParentElement(event.target, "DIALOG");
    dialog.close();

    sendNotification(
        "Marke gelöscht",
        "Die Marke wurde erfolgreich gelöscht",
        NOTIFICATION_TYPE_SUCCESS
    );
}

/**
 * 
 * @param {PointerEvent} event 
 */
function onAssignAddressesClicked(event){
    const assignAddressesDialog = document.getElementById("assign-brand-address-dialog");
    assignAddressesDialog.showModal();
}

function onAssignAddressInputChanged(event){
    event.preventDefault();

    if (timeout !== null){
        clearTimeout(timeout);
    }

    timeout = setTimeout(() => updateAddressChoices(event.target.form), 3000);
}

/**
 * 
 * @param {SubmitEvent} event 
 * @returns 
 */
async function onAssignAddressesFormSubmitted(event){
    event.preventDefault();

    const form = event.target;
    const data = new FormData(form);

    const result = await BrandAPI.assignAddresses(BRAND_ID, data);
    if (result.success === false){
        sendNotification("Fehlgeschlagen", "Fehlgeschlagen", NOTIFICATION_TYPE_ERROR);
        return;
    }

    // Create new table rows for the new addresses    
    const dummyTableRow = document.querySelector("#brand-addresses-table tbody tr.dummy");
    for (const brandAddress of result.content.addresses){
        const newTableRow = dummyTableRow.cloneNode(true);
        const cells = newTableRow.querySelectorAll("td");
        cells[0].innerText = `${brandAddress.address.street} ${brandAddress.address.number}`;
        cells[1].innerText = brandAddress.address.city;
        cells[2].innerText = brandAddress.address.postal_code;
        cells[3].innerText = brandAddress.address.region;
        cells[4].innerText = brandAddress.address.country.name;
        cells[5].innerText = brandAddress.start_date;
        cells[6].innerText = brandAddress.end_date;
        
        // Update dataset of action buttons
        cells[7].children[0].dataset.start_date = brandAddress.start_date;
        cells[7].children[0].dataset.end_date = brandAddress.end_date;
        cells[7].children[0].dataset.id = brandAddress.id;
        cells[7].children[1].dataset.id = brandAddress.id;
        cells[7].children[2].dataset.id = brandAddress.id;

        newTableRow.classList.remove("dummy");
        dummyTableRow.parentElement.insertAdjacentElement("afterbegin", newTableRow);
    }

    hideNoDataTableRow(findParentElement(dummyTableRow, "TABLE"));

    sendNotification(
        "Addresses assigned",
        `You have assigned ${result.content.addresses.length} addresses to ${result.content.brand.name}`,
        NOTIFICATION_TYPE_SUCCESS
    );

    const dialog = findParentElement(form, "DIALOG");
    dialog.close();
}

/**
 * 
 * @param {PointerEvent} event 
 */
function onUpdateAddressesClicked(event){
    event.preventDefault();
    updateAddressChoices(form);
}

/**
 * 
 * @param {PointerEvent} event 
 * @returns 
 */
async function onUnassignAddressClicked(event){
    event.preventDefault();

    const addressId = event.target.dataset.id;
    const result = await BrandAPI.unassignAddress(BRAND_ID, addressId);
    if (result.success === false){
        sendNotification(
            "Abmelden fehlgeschlagen",
            `Die Adresse konnte nicht abgemeldet werden: ${result.errors}`,
            NOTIFICATION_TYPE_ERROR
        );
        return;
    }

    const formRow = findParentElement(event.target, "TR");
    const tableRowCells = formRow.querySelectorAll("td");
    tableRowCells[6].innerText = result.content.end_date;

    sendNotification(
        "Abmeldung erfolgreich",
        "Die Addresse wurde erfolgreich abgemeldet",
        NOTIFICATION_TYPE_SUCCESS
    );

    // TODO: Move the table row to the previous addresses table
}

/**
 * 
 * @param {PointerEvent} event 
 * @returns 
 */
async function onDeleteAddressClicked(event){
    event.preventDefault();

    const brandAddressId = event.target.dataset.id;
    const result = await BrandAPI.deleteAddress(BRAND_ID, brandAddressId);
    if (result.success === false){
        sendNotification(
            "Löschen fehlgeschlagen",
            "Die Adresse konnte nicht gelöscht werden",
            NOTIFICATION_TYPE_SUCCESS
        );
        return;
    }

    const tableRow = findParentElement(event.target, "TR");
    const addressesTable = findParentElement(tableRow, "TABLE");
    tableRow.remove();

    if (tableHasDataRows(addressesTable) === false){
        showNoDataTableRow(addressesTable);
    }
}

/**
 * 
 * @param {PointerEvent} event 
 */
function onEditAssociationClicked(event){
    const dialog = document.getElementById("edit-association-dialog");
    dialog.showModal();

    const button = event.target;

    startDateInput = dialog.querySelector("input[name='start_date']");
    startDateInput.value = button.dataset.from;
    startDateInput.max = button.dataset.to;
    
    endDateInput = dialog.querySelector("input[name='end_date']");
    endDateInput.value = button.dataset.to;
    endDateInput.min = button.dataset.from;

    dialog.querySelector("input[name='id']").value = button.dataset.id;
}

/**
 * 
 * @param {SubmitEvent} event 
 * @returns 
 */
async function onEditAddressAssociationFormSubmitted(event){
    event.preventDefault();

    const form = event.target;
    const data = new FormData(form);
    const brandAddressId = data.get("id");

    removeFormErrors(form);

    const result = await BrandAPI.updateAddressAssociation(brandAddressId, data);
    if (result.success === false){
        let errorMessage = result.errors;
        
        if (result.errors instanceof Object){
            displayFormErrors(form, result.errors);
            errorMessage = "Updating address failed";
        }

        sendNotification(
            "Error",
            errorMessage,
            NOTIFICATION_TYPE_ERROR
        );
        return;
    }

    sendNotification(
        "Success",
        "Updated successfully",
        NOTIFICATION_TYPE_SUCCESS
    );

    // Update table row
    const tableRowCells = document.querySelectorAll(`#association-table-row-${brandAddressId} td`);
    tableRowCells[5].innerText = result.content.start_date;
    tableRowCells[6].innerText = result.content.end_date || "-";

    const dialog = findParentElement(form, "DIALOG");
    dialog.close();
}

// ####################
// # HELPER FUNCTIONS #
// ####################

/**
 * Updates the possible address choices based on the filter in the filter form
 * @param {HTMLFormElement} form - The form used to filter addresses
 * @returns 
 */
async function updateAddressChoices(form){
    const data = new FormData(form);
    data.set("exclude", BRAND_ID);
    data.delete("id");
    data.delete("csrfmiddlewaretoken");
    
    const result = await AddressesAPI.search(data);
    if (result.success === false){
        // TODO: Properly handle the error case
        alert("Error");
        return;
    }

    const options = result.content.map(address => {
        const option = document.createElement("OPTION");
        option.value = address.id;
        option.textContent = `${address.street} ${address.number}, ${address.postal_code}, ${address.city}`;
        return option;
    });

    const assignAddressesForm = document.getElementById("assign-addresses-form");
    assignAddressesForm.addresses.replaceChildren(...options);
}

/**
 * Create a new table row for a brand
 * @param {Brand} brand - The brand to create a table row for
 * @returns {HTMLTableRowElement} - The new table row element for the brand
 */
function createNewBrandTableRow(brand){
    const brandClone = document
        .getElementById("brand-template")
        .content
        .cloneNode(true)
        .children[0];

    brandClone.dataset.id = brand.id;
    const cells = brandClone.querySelectorAll("td");
    cells[0].children[0].src = brand.icon;
    cells[1].innerText = brand.name;
    cells[2].innerText = brand.has_physical_stores;
    cells[3].innerText = brand.default_channel;
    cells[4].innerText = 0;
    cells[5].children[1].dataset.id = brand.id;
    cells[5].children[2].dataset.id = brand.id;
    cells[5].children[2].dataset.name = brand.name;
    
    const currentUrl = cells[5].children[0].href;
    cells[5].children[0].href = currentUrl.replace("0", brand.id);

    return brandClone;
}