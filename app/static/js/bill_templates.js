const SECTIONS = {
    main: "main",
    brand: "brand",
    address: "address",
    group: "group"
}

/**
 * 
 * @param {PointerEvent} event 
 */
function onAddTemplateClicked(event){
    event.preventDefault();

    const dialog = document.getElementById("bill-template-dialog");
    dialog.showModal();
}

/**
 * @function onEditTemplateClicked
 * @param {PointerEvent} event 
 */
async function onEditTemplateClicked(event){
    event.preventDefault();

    const templateId = event.target.dataset.id;
    const getTemplateResult = await BillTemplateAPI.get(templateId);
    if (getTemplateResult.success === false){
        sendNotification("Loading template failed", `Loading the template failed: ${getTemplateResult.errors}`, NOTIFICATION_TYPE_ERROR);
        return;
    }
    const template = getTemplateResult.content;

    const dialog = document.getElementById("bill-template-dialog");

    dialog.querySelector("input[name='id']").value = template.id;
    dialog.querySelector("input[name='name']").value = template.name;

    if (template.brand !== null){
        const brandSelect = dialog.querySelector("select[name='brand']");
        brandSelect.children[0].value = parseInt(template.brand.pk);
        brandSelect.children[0].innerText = template.brand.name;
        brandSelect.value = parseInt(template.brand.pk);

        // Since a brand is selected, enable address selection
        const chooseAddressButton = document.getElementById("choose-address-button");
        chooseAddressButton.disabled = false;
        chooseAddressButton.title = "";
    }

    if (template.address !== null){
        const addressSelect = dialog.querySelector("select[name='address']");
        addressSelect.children[0].value = parseInt(template.address.id);
        addressSelect.children[0].innerText = `${template.address.street} ${template.address.number}, ${template.address.city}, ${template.address.country.name}`;
        addressSelect.value = parseInt(template.address.id);
    }

    if (template.group !== null){
        const addressSelect = dialog.querySelector("select[name='group']");
        addressSelect.children[0].value = parseInt(template.group.id);
        addressSelect.children[0].innerText = template.group.name;
        addressSelect.value = parseInt(template.group.id);
    }

    dialog.showModal();
}

function activateSection(sectionName){
    const mainSection = document.getElementById("main-section");
    const brandSection = document.getElementById("brand-section");
    const addressSection = document.getElementById("address-section");
    const groupSection = document.getElementById("group-section");
    const mainFooter = document.getElementById("main-footer");
    const brandFooter = document.getElementById("brand-footer");
    const addressFooter = document.getElementById("address-footer");
    const groupFooter = document.getElementById("group-footer");

    mainSection.style.display = (sectionName === "main") ? "block" : "none";
    mainFooter.style.display = (sectionName === "main") ? "flex" : "none";
    brandSection.style.display = (sectionName === "brand") ? "block" : "none";
    brandFooter.style.display = (sectionName === "brand") ? "flex" : "none";
    addressSection.style.display = (sectionName === "address") ? "block" : "none";
    addressFooter.style.display = (sectionName === "address") ? "flex" : "none";
    groupSection.style.display = (sectionName === "group") ? "block" : "none";
    groupFooter.style.display = (sectionName === "group") ? "flex" : "none";
}

/**
 * @function onTemplateFormSubmitted
 * @param {SubmitEvent} event 
 */
async function onTemplateFormSubmitted(event){
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);
    formData.append("brand", form.brand.value);
    formData.append("address", form.address.value);
    formData.append("group", form.group.value);

    const id = formData.get("id");
    const isEdit = id !== undefined && id !== "";

    removeFormErrors(form);

    const result = (isEdit)
        ? await BillTemplateAPI.update(id, formData)
        : await BillTemplateAPI.create(formData);

    if (result.success === false){
        if (result.errors instanceof Object && "form_errors" in result.errors){
            displayFormErrors(form, result.errors["form_errors"]);
        }
        sendNotification("Saving template failed", "Saving the template failed", NOTIFICATION_TYPE_ERROR);
        return;
    }

    const dialog = findParentElement(form, "DIALOG");
    dialog.close();

    window.location.reload();
}

/**
 * @function onSelectBandClicked
 * @param {PointerEvent} event 
 */
function onSelectBrandClicked(event){
    event.preventDefault();
    activateSection(SECTIONS.brand);
}

/**
 * @function onSelectAddressClicked
 * @param {PointerEvent} event 
 */
function onSelectAddressClicked(event){
    event.preventDefault();
    activateSection(SECTIONS.address)
}

/**
 * @function onSelectGroupClicked
 * @param {PointerEvent} event 
 */
async function onSelectGroupClicked(event){
    event.preventDefault();
    activateSection(SECTIONS.group);

    event.preventDefault();

    const userGroupList = document.getElementById("user-group-list");
    const globalGroupList = document.getElementById("global-group-list");
    removeAllChildren(userGroupList);
    removeAllChildren(globalGroupList);

    const result = await GroupAPI.getAll();
    if (result.success === false) {
        sendNotification(
        "Gruppen abfragen fehlgeschlagen",
        `Konnte keine Gruppen abfragen: ${result.errors}`,
        NOTIFICATION_TYPE_ERROR
        );
        return;
    }

    for (const userGroup of result.content.user_groups) {
        const groupElement = createGroupElement(userGroup);
        userGroupList.appendChild(groupElement);
    }

    for (const globalGroup of result.content.global_groups) {
        const groupElement = createGroupElement(globalGroup);
        globalGroupList.appendChild(groupElement);
    }
}

/**
 * @function onSearchBrandsClicked
 * @param {PointerEvent} event 
 */
async function onSearchBrandsClicked(event){
    event.preventDefault();

    const searchQueryInput = document.getElementsByName("brand-search-query");
    if (searchQueryInput.length > 0){
        const searchQueryValue = searchQueryInput[0].value;
        searchBrands(searchQueryValue);
    }
}

let searchBrandInputTimeout = null;

/**
 * @function onSearchBrandQueryInputChanged
 * @param {KeyboardEvent} event 
 */
function onSearchBrandQueryInputChanged(event){
    event.preventDefault();

    if (searchBrandInputTimeout !== null){
        clearTimeout(searchBrandInputTimeout);
    }

    if (event.key === "Enter"){
        searchBrands(event.target.value);
    }else{
        searchBrandInputTimeout = setTimeout(async () => searchBrands(event.target.value), 5000);
    }
}

/**
 * @function searchBrands
 * @param {string} query 
 * @returns 
 */
async function searchBrands(query){
    const result = await BrandAPI.search(query);
    if (result.success === false){
        sendNotification(
            "Laden fehlgeschlagen",
            "Marken konnte nicht geladen werden",
            NOTIFICATION_TYPE_ERROR
        );
        return;
    }

    const images = result.content.map(brand => {
        const template = getTemplate("select-brand");
        if (template === null) return;
        template.classList.add("clickable");
        template.querySelector("img").src = brand.icon;
        template.querySelector("h4").innerText = brand.name;
        template.dataset.id = brand.pk;
        template.dataset.name = brand.name;
        template.addEventListener("click", onBrandSelected);
        return template;
    });

    const imageContainer = document.getElementById("brand-list");
    imageContainer.replaceChildren(...images);
}

/**
 * @function onBrandSelected
 * @param {PointerEvent} event 
 */
function onBrandSelected(event){
    event.preventDefault();

    const select = document.querySelector("#create-template-form select[name='brand']");
    const { id, name } = event.currentTarget.dataset;

    // Check if a brand was choosen before and if it's different from the one chosen now.
    // If so, reset the address select to prevent corrupted data. This obviously needs to be done
    // before the select is updated to the new brand
    if (select.children[0].innerText !== name){
        const addressSelect = document.querySelector("#create-template-form select[name='address']");
        addressSelect.value = "";
        addressSelect.children[0].value = "";
        addressSelect.children[0].innerText = "";
    }

    select.children[0].value = parseInt(id);
    select.children[0].innerText = name;
    select.value = parseInt(event.currentTarget.dataset.id);

    // Enable address selection
    const chooseAddressButton = document.getElementById("choose-address-button");
    chooseAddressButton.disabled = false;
    chooseAddressButton.title = "";

    clearBrandForm();

    activateSection(SECTIONS.main);
}

 /**
  * @function onAbortChooseBrandClicked
  * @param {PointerEvent} event 
  */
function onAbortChooseBrandClicked(event){
    event.preventDefault();    
    clearBrandForm();
    activateSection(SECTIONS.main);
}

/**
 * @function clearBrandForm
 * Clears the brand form. The timeout is cleared, the search query input is resetted and all brands are removed from the brand list
 */
function clearBrandForm(){
    if (searchBrandInputTimeout !== null){
        clearTimeout(searchBrandInputTimeout);
    }

    const brandSearchInput = document.getElementsByName("brand-search-query");
    if (brandSearchInput.length > 0){
        brandSearchInput[0].value = "";
    }

    const brandList = document.getElementById("brand-list");
    while(brandList.firstChild){
        brandList.removeChild(brandList.lastChild);
    }
}

let searchAddressInputTimeout = null;

/**
 * @function onAssignAddressInputChanged
 * Handles changes to any of the address search inputs (country, city, street, postal code)
 * Sets a timeout of 3 seconds to query the backend for addresses. If a timeout is currently active, it is cleared and restarted
 * @param {KeyboardEvent} event 
 */
function onAssignAddressInputChanged(event){
    event.preventDefault();

    if (searchAddressInputTimeout !== null){
        clearTimeout(searchAddressInputTimeout);
    }

    searchAddressInputTimeout = setTimeout(() => updateAddressChoices(event.target.form), 3000);
}

/**
 * @function onUpdateAddressesClicked
 * Handles the event of the address search form being manually submitted by the user clicking on the search button.
 * Calls the updateAddressChoices function. If a timeout is currently set, it's cleared
 * @param {PointerEvent} event 
 */
function onUpdateAddressesClicked(event){
  event.preventDefault();

  if (searchAddressInputTimeout !== null){
    clearTimeout(searchAddressInputTimeout);
  }

  updateAddressChoices(event.target.form);
}

/**
 * @function updateAddressChoices
 * Updates the possible address choices based on the filter in the filter form
 * @param {HTMLFormElement} form - The form used to filter addresses
 * @returns 
 */
async function updateAddressChoices(form){
    const brandId = document.querySelector("select[name='brand']").value;
    const data = new FormData(form);
    data.set("brand", brandId);
    data.delete("id");
    data.delete("csrfmiddlewaretoken");
    
    const result = await AddressesAPI.search(data);
    if (result.success === false){
        alert("Error");
        return;
    }

    const addressesSelect = document.querySelector("select[name='available-addresses']");
    const noAddressesHint = document.getElementById("no-addresses-hint");

    // If no address was returned, hide the table and show the "no addresses matches the parameters" hint
    if (result.content.length === 0){
      removeAllChildren(addressesSelect);
      noAddressesHint.style.display = "block";
      return;
    }

    noAddressesHint.style.display = "none";
    const options = result.content.map(address => {
        const option = document.createElement("OPTION");
        option.value = address.id;
        option.textContent = `${address.street} ${address.number}, ${address.postal_code}, ${address.city}`;
        return option;
    });

    addressesSelect.replaceChildren(...options);
}

function onSelectAddressFormSubmitted(event){
    event.preventDefault();
    const form = event.target;
    const availableAddressesSelect = form["available-addresses"];
    const selectedAddressOption = availableAddressesSelect.querySelector(`option[value='${availableAddressesSelect.value}']`);
    if (selectedAddressOption === null) return;

    const targetSelect = document.querySelector("#create-template-form select[name='address']");
    const targetOption = targetSelect.querySelector("option");
    targetOption.innerText = selectedAddressOption.innerText;
    targetOption.value = availableAddressesSelect.value;
    targetSelect.value = availableAddressesSelect.value;

    clearAddressForm();

    activateSection(SECTIONS.main);
}

/**
 * @function clearAddressForm
 * Clears the brand form. The timeout is cleared, all inputs are resetted and all brands are removed from the brand list
 */
function clearAddressForm(){
    const filterForm = document.getElementById("address-filter-form");
    filterForm.country.value = 1;
    filterForm.city.value = "";
    filterForm.region.value = "";
    filterForm.postal_code.value = "";

    const chooseAddressForm = document.getElementById("choose-address-form");
    const addressSelect = chooseAddressForm.elements["available-addresses"];
    while (addressSelect.firstChild){
        addressSelect.removeChild(addressSelect.lastChild);
    }
}

 /**
  * @function onAbortChooseBrandClicked
  * @param {PointerEvent} event 
  */
function onAbortChooseGroupClicked(event){
    event.preventDefault();
    activateSection(SECTIONS.main);
}

function createGroupElement(group) {
    const groupTemplate = document.getElementById("group-template");
    const container = groupTemplate.content.cloneNode(true);
    container.children[0].dataset.id = group.id;
    container.children[0].dataset.name = group.name;
    container.children[0].dataset.icon = group.icon;

    const image = container.querySelector("img");
    image.src = group.icon;
    image.alt = `${group.name} Logo`;

    container.querySelector("h2").innerText = group.name;

    return container;
}

/**
 * @function onGroupSelected
 * @param {PointerEvent} event 
 */
function onGroupSelected(event){
    event.preventDefault();

    console.log(event.target.dataset.name);

    const targetSelect = document.querySelector("#create-template-form select[name='group']");
    const targetOption = targetSelect.querySelector("option");
    targetOption.innerText = event.target.dataset.name;
    targetOption.value = event.target.dataset.id;
    targetSelect.value = event.target.dataset.id;

    activateSection(SECTIONS.main);

    const userGroupList = document.getElementById("user-group-list");
    const globalGroupList = document.getElementById("global-group-list");
    removeAllChildren(userGroupList);
    removeAllChildren(globalGroupList);
}