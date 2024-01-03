class BillAPI {
  static async create(data) {
    const options = getOptions("POST", data);
    return await makeRequest(CREATE_BILL_URL, options);
  }
}

function getOptions(method, data) {
  const body = data instanceof FormData ? data : JSON.stringify(data);

  // Set default header values
  const headers = new Headers();
  if (data.has("csrfmiddlewaretoken")) {
    headers.append("X-CSRFToken", data.get("csrfmiddlewaretoken"));
    //headers.append("content-type", "multipart/form-data");
  }

  return {
    method,
    headers,
    body,
  };
}

async function makeRequest(url, options) {
  const response = await fetch(url, options);
  const body = isJsonResponse(response) ? await response.json() : await response.text();

  return { success: response.status === 200, content: body };
}

function isJsonResponse(response) {
  return response.headers.get("content-type").indexOf("application/json") !== -1;
}
