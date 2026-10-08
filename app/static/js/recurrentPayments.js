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
