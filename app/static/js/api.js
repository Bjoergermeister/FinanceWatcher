const CONTENT_TYPE_JSON = "application/json";
const CONTENT_TYPE_FORM_DATA = "multipart/form-data";
const CONTENT_TYPE_URL_ENCODED = "application/x-www-form-urlencoded; charset=UTF-8";

const HTTP_OK = 200;
const HTTP_NOT_FOUND = 404;
const HTTP_FORBIDDEN = 403;
const HTTP_INTERNAL_SERVER_ERROR = 500;

class BillAPI {
  static async create(data) {
    const options = getOptions("POST", data, {
      csrfmiddlewaretoken: CSRF_MIDDLEWARE_TOKEN,
      "Content-Type": CONTENT_TYPE_FORM_DATA,
    });

    prepareHeadersForFileUpload(options.headers);

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
    const options = getOptions("POST", data, {
      "Content-Type": CONTENT_TYPE_FORM_DATA,
    });

    prepareHeadersForFileUpload(options.headers);

    return await makeRequest(url, options);
  }

  static async delete(billId) {
    const url = DELETE_BILL_URL.replace(/\d+/g, billId);
    const options = getOptions("DELETE", { csrfmiddlewaretoken: CSRF_MIDDLEWARE_TOKEN });
    return await makeRequest(url, options);
  }

  static async preview(billId) {
    const url = PREVIEW_BILL_URL.replace(/0/g, billId);
    return await makeRequest(url);
  }
}

class GroupAPI {
  static async create(data) {
    const options = getOptions("POST", data, { "Content-Type": CONTENT_TYPE_FORM_DATA });

    prepareHeadersForFileUpload(options.headers);

    return await makeRequest(CREATE_GROUP_URL, options);
  }

  static async edit(groupId, data) {
    const url = EDIT_GROUP_URL.replace(/1/g, groupId);
    const headers = {
      "X-CSRFToken": CSRF_MIDDLEWARE_TOKEN,
      "Content-Type": CONTENT_TYPE_FORM_DATA,
    };
    const options = getOptions("POST", data, headers);

    prepareHeadersForFileUpload(options.headers);

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

// ####################################################################################
// #                                 Helper Functions                                 #
// ####################################################################################

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

  let body = null;
  if (contentType === CONTENT_TYPE_JSON) {
    body = JSON.stringify(data);
  } else if (contentType === CONTENT_TYPE_FORM_DATA) {
    body = data instanceof FormData ? data : new FormData(data);
  } else {
    body = new URLSearchParams(data);
  }

  return {
    method,
    headers,
    body,
  };
}

async function makeRequest(url, options) {
  const response = await fetch(url, options);
  const success = response.status < 300;

  let content;
    if (response.status === HTTP_INTERNAL_SERVER_ERROR){
        content = "Internal Server Error";
    }else if (response.status === HTTP_FORBIDDEN){
        content = "Forbidden";
    }else if (isJsonResponse(response)){
        content = await response.json();
    }else if (isHTMLResponse(response) && response.status === HTTP_NOT_FOUND){
        content = `Die angeforderte Seite wurde nicht gefunden: ${response.url}`;
    }else if (isHTMLResponse(response)){
        content = await response.text();
    }else{
        content = `Es ist ein unerwarteter Fehler aufgetreten: Content-Type: ${response.headers.get("Content-Type") ?? "Unbekannt"}`;
    }

    return {
        success,
        status: response.status,
        content: (success) ? content : undefined,
        errors: (success) ? undefined : content
    }
}

/**
 * 
 * @param {Response} response - The response to check
 * @returns Whether the response contains HTML content
 */
function isHTMLResponse(response) {
  return response.headers.get("content-type").indexOf("text/html") !== -1;
}
/**
 * 
 * @param {Response} response - The response to check
 * @returns Whether the response contains JSON content
 */
function isJsonResponse(response) {
  return response.headers.get("content-type").indexOf("application/json") !== -1;
}

function getCSRFToken(data) {
  if (data instanceof FormData) return data.get("csrfmiddlewaretoken");
  return data["csrfmiddlewaretoken"];
}

/**
 * Deletes the Content-Type header from the request headers
 *
 * For file uploads to work, Django requires the form data to be send as multipart/form-data. This MIME type requires a special header
 * which not only specifies the MIME-Type itself but also a boundary value. The boundary value is used as a delimiter between values in the body.
 * If the boundary value is not present, Django won't be able to understand the request body properly. The browser calculates the boundary value automatically and
 * sets the header, but only if no header value is already presents. But the getOption methods sets it, so we delete it here.
 * @param {Headers} headers - The headers to send with the request
 */
function prepareHeadersForFileUpload(headers) {
  delete headers["Content-Type"];
}
