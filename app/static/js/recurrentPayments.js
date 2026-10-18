const RECURRENT_PAYMENT_PRICE_FORMSET_PREFIX = "recurrent_payment_price";

/**
 * 
 * @param {SubmitEvent} event 
 */
async function onCreateRecurrentPaymentFormSubmitted(event){
    event.preventDefault();

    const data = new FormData(event.target);

    const result = await RecurrentPaymentAPI.create(data);
    if (result.success === false){
        return;
    }

    console.log(result);

    const createRecurrentPaymentDialog = document.getElementById("create-recurrent-payment-dialog");
    createRecurrentPaymentDialog.close();
}

/**
 * @function onChangeRecurrentPaymentPriceClicked(event)
 * @param {PointerEvent} event 
 */
async function onChangeRecurrentPaymentPriceClicked(event){
    event.preventDefault();

    const recurrentPaymentId = event.target.dataset.id;
    const result = await RecurrentPaymentAPI.get(recurrentPaymentId);
    if (result.success === false){
        alert("failure");
        return;
    }

    const recurrentPayment = result.content;

    const dialog = document.getElementById("change-recurrent-payment-price-dialog");
    dialog.querySelector("input[name='id']").value = recurrentPaymentId;

    const currentPriceValidThroughDate = recurrentPayment.prices[0].valid_through;
    
    const priceInput = dialog.querySelector("input[name='price']");
    priceInput.value = recurrentPayment.prices[0].price;
    
    const startDateInput = dialog.querySelector("input[type='date']");
    if (currentPriceValidThroughDate === null){
        startDateInput.value = new Date(Date.now()).toISOString().split("T")[0];
    }else{
        startDateInput.value = currentPriceValidThroughDate;
    }

    // fill table with price history
    const pricesTable = dialog.querySelector("#prices-history-table");
    const tableRows = recurrentPayment.prices.map(price => createTableRow([
        createDataTableCell(price.price),
        createDataTableCell((price.valid_from !== null) ? new Date(price.valid_from).toLocaleDateString() : ""),
        createDataTableCell((price.valid_through !== null) ? new Date(price.valid_through).toLocaleDateString() : "")
    ]));
    pricesTable.querySelector("tbody").replaceChildren(...tableRows);

    dialog.showModal();
}

/**
 * @function onChangeRecurrentPaymentPriceFormSubmitted
 * @param {SubmitEvent} event 
 */
async function onChangeRecurrentPaymentPriceFormSubmitted(event){
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);

    const recurrentPaymentId = formData.get("id");

    const result = await RecurrentPaymentAPI.changePrice(recurrentPaymentId, formData);
    if (result.success === false){
        sendNotification("Changing recurrent payment price failed", "Changing the recurrent payment price failed", NOTIFICATION_TYPE_ERROR);
        return;
    }

    window.location.reload();
}

/**
 * @function onEditRecurrentPaymentClicked
 * @param {PointerEvent} event 
 */
async function onEditRecurrentPaymentClicked(event){
    event.preventDefault();

    const recurrentPaymentId = event.target.dataset.id;

    const result = await RecurrentPaymentAPI.get(recurrentPaymentId);
    const recurrentPayment = result.content;

    const dialog = document.getElementById("edit-recurrent-payment-dialog");
    const form = dialog.querySelector("form");

    form.elements["id"].value = recurrentPayment.id;
    form.elements["name"].value = recurrentPayment.name;
    form.elements["start_date"].value = new Date(recurrentPayment.start_date).toLocaleDateString();
    form.elements["brand"].value = recurrentPayment.brand;
    form.elements["frequency"].value = recurrentPayment.frequency;

    form.elements[`${RECURRENT_PAYMENT_PRICE_FORMSET_PREFIX}-TOTAL_FORMS`].value = recurrentPayment.prices.length;
    form.elements[`${RECURRENT_PAYMENT_PRICE_FORMSET_PREFIX}-INITIAL_FORMS`].value = recurrentPayment.prices.length;

    // fill table with price history
    const pricesTable = dialog.querySelector("#prices-history-table");
    const tableRows = recurrentPayment.prices.map((price, index) => {
        const validFrom = (price.valid_from !== null) ? new Date(price.valid_from).toISOString().substring(0, 10) : "";
        const validThrough = (price.valid_through !== null) ? new Date(price.valid_through).toISOString().substring(0, 10) : "";

        const tableCells = [
            createNumberInputTableCell(`${RECURRENT_PAYMENT_PRICE_FORMSET_PREFIX}-${index}-price`, price.price),
            createDateInputTableCell(`${RECURRENT_PAYMENT_PRICE_FORMSET_PREFIX}-${index}-valid_from`, validFrom),
            createDateInputTableCell(`${RECURRENT_PAYMENT_PRICE_FORMSET_PREFIX}-${index}-valid_through`, validThrough),
            createHiddenInputTableCell(`${RECURRENT_PAYMENT_PRICE_FORMSET_PREFIX}-${index}-id`, price.id)
        ]

        return createTableRow(tableCells, { "class": "recurrent-payment-price-form-row" });
    });
    pricesTable.querySelector("tbody").replaceChildren(...tableRows);

    dialog.showModal();
}

/**
 * @function onEditRecurrentPaymentFormSubmitted
 * @param {FormEvent} event 
 */
async function onEditRecurrentPaymentFormSubmitted(event){
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);

    const recurrentPaymentId = formData.get("id");

    removeFormErrors(form);
    const result = await RecurrentPaymentAPI.edit(recurrentPaymentId, formData);
    if (result.success === false){
        if (result.errors instanceof Object){
            const hasFormErrors = "form_errors" in result.errors;
            const hasFormsetErrors = "formset_errors" in result.errors;
            if (hasFormErrors || hasFormsetErrors){
                displayFormsetErrors(form, "recurrent-payment-price", result.errors);
            }
        }

        sendErrorNotification("Saving failed", "The recurrent payment couldn't be saved");
        return;
    }

    sendSuccessNotification("Saving successful", "The recurrent payment was saved successfully");
}