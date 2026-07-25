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