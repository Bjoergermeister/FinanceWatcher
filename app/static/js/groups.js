/******************/
/* EVENT HANDLERS */
/******************/

async function onCreateGroupFormSubmitted(event) {
  event.preventDefault();

  const data = new FormData(event.target);
  const result = await GroupAPI.create(data);
  console.log(result);
}
