/**
 * @typedef {Object} Country
 * @property {number} id
 * @property {string} name
 * @property {string} internal_name
 * @property {string} code
 * @property {string} url
 */

/**
 * @typedef {Object} Address
 * @property {number} pk 
 * @property {string} street
 * @property {string} number
 * @property {string} city
 * @property {string} postal_code
 * @property {Country} country 
 */

// ##################
// # EVENT HANDLERS #
// ##################

function onAddAddressClicked(event) {
    event.preventDefault();

    const dialog = document.getElementById('add-address-dialog');
    dialog.showModal();
}

async function onEditAddressClicked(event) {
    event.preventDefault();

    const button = event.currentTarget;
    const addressId = button.dataset.id;

    const result = await AddressesAPI.getSingle(addressId);
    if (result.success === false){
        alert("Error: " + JSON.stringify(result.error));
        return;
    }

    const address = result.content;
    const dialog = document.getElementById('add-address-dialog');
    const form = dialog.querySelector('#address-form');

    for (const propertyName of Object.keys(address)) {
        const formElement = form.elements[propertyName];
        if (formElement) {
            formElement.value = address[propertyName] || '';
        }
    }

    dialog.showModal();
}

async function onDeleteAddressClicked(event) {
    event.preventDefault();

    const button = event.currentTarget;
    const addressId = button.dataset.id;

    const result = await AddressesAPI.delete(addressId);
    if (result.success === false){
        sendNotification(
            "Fehler beim Löschen",
            "Die Adresse konnte nicht gelöscht werden.",
            NOTIFICATION_TYPE_ERROR
        );
        return;
    }

    const tableRow = document.querySelector(`#addresses-table tbody tr[data-id='${addressId}']`);
    tableRow.remove();

    sendNotification("Adresse gelöscht", "Die Adresse wurde erfolgreich gelöscht.", NOTIFICATION_TYPE_SUCCESS);    
}

async function onAddressFormSubmitted(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);

    const id = formData.get('id', null);
    const isEdit = id !== "";
    const result = (isEdit === false)
        ? await AddressesAPI.create(formData)
        : await AddressesAPI.edit(id, formData);

    if (result.success === false){
        alert("Error: " + JSON.stringify(result.error));
        return;
    }
    const updatedAddress = result.content;

    // If we edited an address, we want to update the corresponding table row.
    // If we created a new address, we want to insert a new table row.
    if (isEdit){
        const tableCells = document.querySelectorAll(`#addresses-table tbody tr[data-id='${id}'] td`);
        tableCells[0].innerText = `${updatedAddress.street} ${updatedAddress.number}`;
        tableCells[1].innerText = updatedAddress.city;
        tableCells[2].innerText = updatedAddress.postal_code;
        tableCells[3].innerText = updatedAddress.country.name;
    }else{
        const newAddressTableRow = createAddressTableRow(result.content);
        const addressContainer = document.querySelector("#addresses-table tbody");
        addressContainer.insertAdjacentElement("afterbegin", newAddressTableRow);
    }

    sendNotification("Adresse gespeichert", "Die Adresse wurde erfolgreich gespeichert.", NOTIFICATION_TYPE_SUCCESS);    
    
    // Reset all form inputs
    for (const element of form.elements){
        if (element.tagName === "button") continue;
        element.value = "";
    }

    const dialog = document.getElementById('add-address-dialog');
    dialog.close();
}

// ####################
// # HELPER FUNCTIONS #
// ####################

/**
 * Create a table row for an address
 * @param {Address} address - An address
 * @returns {HTMLTableRowElement} - The table row for the address
 */
function createAddressTableRow(address){
    const addressClone = getTemplate("address", true)

    addressClone.dataset.id = address.id;
    const cells = addressClone.querySelectorAll("td");
    cells[0].innerText = `${address.street} ${address.number}`;
    cells[1].innerText = address.city;
    cells[2].innerText = address.postal_code;
    cells[3].innerText = `${address.country.name}`;
    cells[4].children[0].dataset.id = address.id;
    cells[4].children[1].dataset.id = address.id;

    const flagImage = document.createElement("IMG");
    flagImage.src = address.country.url;
    flagImage.alt = address.country.name;
    flagImage.style.width = "25px";
    cells[3].insertAdjacentElement("afterbegin", flagImage);

    return addressClone;
}