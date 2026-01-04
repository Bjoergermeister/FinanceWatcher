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

class BrandAPI {
  /**
   * Create a new brand
   * @param {FormData} data - The form data for the ned brand
   * @returns {*} An API result object
   */
  static async create(data){
    const options = getOptions("POST", data, { "Content-Type": CONTENT_TYPE_FORM_DATA });
    prepareHeadersForFileUpload(options.headers);
    return await makeRequest(CREATE_BRAND_URL, options);
  }

  /**
   * Gets a brand by its ID
   * @param {int} brandId - The ID of the brand
   * @returns An API result object
   */
  static async get(brandId){
    const url = GET_BRAND_URL.replace(/\d+/g, brandId);
    return await makeRequest(url);
  }

  /**
   * Updates the values of a brand
   * @param {int} brandId - The ID of the brand to update
   * @param {*} data - The updated data of the form 
   * @returns An API result object
   */
  static async edit(brandId, data){
    const url = EDIT_BRAND_URL.replace(/\d+/g, brandId);
    const options = getOptions("POST", data, { "Content-Type": CONTENT_TYPE_FORM_DATA});
    prepareHeadersForFileUpload(options.headers);
    return await makeRequest(url, options);
  }

  /**
   * Deletes a brand by its ID
   * @param {int} brandId - The ID of the bill
   * @returns An API result object
   */
  static async delete(brandId){
    const url = DELETE_BRAND_URL.replace(/\d+/g, brandId);
    const options = getOptions("DELETE", null, { "X-CSRFTOKEN": CSRF_MIDDLEWARE_TOKEN });
    return await makeRequest(url, options);
  }

  /**
   * Assigns addresses to a Brand
   * @param {int} brandId - The ID of the brand
   * @param {Object} data - The IDs of the addresses which should be assigned to the brand
   * @returns An API result
   */
  static async assignAddresses(brandId, data){
    const url = ASSIGN_ADDRESSES_URL.replace(/\d+/g, brandId);
    const options = getOptions("POST", data);
    return await makeRequest(url, options);
  }

  /**
   * Unassigns an address from a brand
   * @param {int} brandId The ID of the brand
   * @param {int} brandAddressId The ID of the association of the address with the brand
   * @returns An API result
   */
  static async unassignAddress(brandId, brandAddressId){
    const url = UNASSIGN_ADDRESS_URL.replace(/\d+/g, brandId);
    return await makeRequest(`${url}?address=${brandAddressId}`);
  }

  static async deleteAddress(brandId, brandAddressId){
    const url = DELETE_ADDRESS_URL.replace(/\d+/g, brandId);
    return await makeRequest(`${url}?address=${brandAddressId}`);
  }

  /**
   * Searches brands by name
   * @param {String} query - A query string that is used to search brands by their name 
   */
  static async search(query){
    const parameters = { query };
    const url = getQueryStringUrl(SEARCH_BRANDS_URL, parameters);
    return await makeRequest(url);
  }
}

class AddressesAPI {
  /**
   * Gets a single address by its ID
   * @param {int} addressId - The ID of the address
   * @returns An API result
   */
  static async getSingle(addressId) {
    const url = GET_ADDRESS_URL.replace(/0/g, addressId);
    return await makeRequest(url);
  }

  /**
   * Creates a new address
   * @param {FormData} data - The form data of the address form
   * @returns An API result
   */
  static async create(data) {
    const options = getOptions("POST", data);
    return await makeRequest(CREATE_ADDRESS_URL, options);
  }

  /**
   * Updates an address
   * @param {int} addressId - The ID of the address
   * @param {*} data - The updated form data for the address
   * @returns An API result
   */
  static async edit(addressId, data) {
    const url = EDIT_ADDRESS_URL.replace(/0/g, addressId);
    const options = getOptions("POST", data);
    return await makeRequest(url, options);
  }

  /**
   * Deletes an address by its ID
   * @param {int} addressId - The ID of the address to delete
   * @returns 
   */
  static async delete(addressId) {
    const url = DELETE_ADDRESS_URL.replace(/0/g, addressId);
    const options = getOptions("DELETE", undefined, { "X-CSRFToken": CSRF_MIDDLEWARE_TOKEN });
    return await makeRequest(url, options);
  }

  /**
   * Searches addresses
   * @param {FormData} data
   * @returns 
   */
  static async search(data){
    const url = getQueryStringUrl(SEARCH_ADDRESSES_URL, data);
    return await makeRequest(url);
  }
}

// ####################################################################################
// #                                 Helper Functions                                 #
// ####################################################################################

/**
 * 
 * @param {string} baseUrl - The base part of the URL
 * @param {Object | FormData} parameters - An object containing the key and values of query parameters 
 * @returns {string}
 */
function getQueryStringUrl(baseUrl, parameters){
  const entries = (parameters instanceof FormData) 
    ? Array.from(parameters.entries()) 
    : Object.entries(parameters);
  
  const encodedParameters = entries
      .filter(entry => entry[1].length > 0)
      .map(entry => `${encodeURIComponent(entry[0])}=${encodeURIComponent(entry[1])}`);
  const queryString = encodedParameters.join('&');

  return (queryString.length > 0)
    ? `${baseUrl}?${queryString}`
    : baseUrl;
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

/**
 * Makes a request to an external API
 * @param {string} url - Die URL of the request
 * @param {*} options - The Options of the request
 * @returns - An API response
 */
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
 * Checks if the content type of a response is HTML
 * @param {Response} response - The response to check
 * @returns {boolean} Whether the response contains HTML content
 */
function isHTMLResponse(response) {
  return response.headers.get("content-type").indexOf("text/html") !== -1;
}
/**
 * Checks if the content type of the response is JSON
 * @param {Response} response - The response to check
 * @returns {boolean} Whether the response contains JSON content
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
