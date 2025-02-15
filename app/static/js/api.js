class BillAPI {
  static async create(data) {
    const options = getOptions("POST", data, {
      csrfmiddlewaretoken: CSRF_MIDDLEWARE_TOKEN,
    });
    return await makeRequest(CREATE_BILL_URL, options);
  }

  /**
   *
   * @param {number} billId - The id of the bill that should be edited
   * @param {*} data
   * @returns
   */
  static async edit(billId, data) {
    const url = EDIT_BILL_URL.replace(/\d+/g, billId);
    const options = getOptions("POST", data);
    return await makeRequest(url, options);
  }

  static async delete(billId) {
    const url = DELETE_BILL_URL.replace(/\d+/g, billId);
    const options = getOptions("DELETE", { csrfmiddlewaretoken: CSRF_MIDDLEWARE_TOKEN });
    return await makeRequest(url, options);
  }
}

class GroupAPI {
  static async create(data) {
    const options = getOptions("POST", data);
    return await makeRequest(CREATE_GROUP_URL, options);
  }

  static async edit(groupId, data) {
    data.set("X-CSRFToken", CSRF_MIDDLEWARE_TOKEN);

    const url = EDIT_GROUP_URL.replace(/1/g, groupId);
    const options = getOptions("POST", data);
    return await makeRequest(url, options);
  }

  static async delete(groupId) {
    const url = DELETE_GROUP_URL.replace(/1/g, groupId);
    const options = getOptions("POST", { csrfmiddlewaretoken: CSRF_MIDDLEWARE_TOKEN });
    return await makeRequest(url, options);
  }

  /**
   *
   * @param {*} alreadyChoosenGroups
   * @returns
   */
  static async getAll(alreadyChosenGroups) {
    const headers = {
      "Content-Type": "application/json",
      "X-CSRFToken": CSRF_MIDDLEWARE_TOKEN,
    };
    const data = {
      csrfmiddlewaretoken: CSRF_MIDDLEWARE_TOKEN,
      alreadyChosenGroups,
    };
    const options = getOptions("POST", data, headers);

    return await makeRequest(ALL_GROUPS_URL, options);
  }
}

/**
 *
 * @param {string} method
 * @param {*} data
 * @param {*} headers
 * @returns
 */
function getOptions(method, data, headers) {
  const contentType =
    headers !== undefined && "Content-Type" in headers
      ? headers["Content-Type"]
      : "application/x-www-form-urlencoded; charset=UTF-8";

  headers = headers ?? new Headers({ "Content-Type": contentType });

  const body =
    data instanceof FormData ? new URLSearchParams(data) : JSON.stringify(data);

  //headers.append("X-CSRFToken", getCSRFToken(data));

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

function getCSRFToken(data) {
  if (data instanceof FormData) return data.get("csrfmiddlewaretoken");
  return data["csrfmiddlewaretoken"];
}
