let timeout = null;

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

async function onEditBrandClicked(event){
    const brandId = event.target.dataset.id;
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

async function onDeleteBrandClicked(event){
    const brandId = event.target.dataset.id;
    const result = await BrandAPI.delete(brandId);
    if (result.success === false){
        sendNotification(
            "Löschen fehlgeschlagen",
            `Die Marke konnte nicht gelöscht werden: ${result.errors}`,
            NOTIFICATION_TYPE_ERROR
        );
        return;
    }

    const tableRow = findParentElement(event.target, "TR");
    tableRow.remove();

    sendNotification(
        "Marke gelöscht",
        "Die Marke wurde erfolgreich gelöscht",
        NOTIFICATION_TYPE_SUCCESS
    );
}

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

async function onAssignAddressesFormSubmitted(event){
    event.preventDefault();

    const form = event.target;
    const data = new FormData(form);

    const result = await BrandAPI.assignAddresses(BRAND_ID, data);
    if (result.success === false){
        sendNotification("Fehlgeschlagen", "Fehlgeschlagen", NOTIFICATION_TYPE_ERROR);
        return;
    }

    alert("Success!");
}

function onUpdateAddressesClicked(event){
    event.preventDefault();
    updateAddressChoices(form);
}

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
    tableRow.remove();

    // TODO: If no addresses remain after deleting this one,
    // show the "no addresses" table row
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
    console.log(result);
}

/**
 * Create a new table row for a brand
 * @param {*} brand
 * @returns {HTMLTableRowElement} - The new table row element for the brand
 */
function createNewBrandTableRow(brand){
    const brandClone = document
        .getElementById("brand-template")
        .content
        .cloneNode(true)
        .children[0];

    brandClone.dataset.id = brand.pk;
    const cells = brandClone.querySelectorAll("td");
    cells[0].children[0].src = brand.icon;
    cells[1].innerText = brand.name;
    cells[2].innerText = brand.has_physical_stores;
    cells[3].innerText = brand.default_channel;

    return brandClone;
}